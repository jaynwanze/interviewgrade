import 'server-only';

import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { practices } from '@/db/schema/practices';
import {
  claimLegacyPracticeImport,
  findLegacyPracticeImport,
} from '@/modules/practice/legacy-practice-import.repository';
import { loadLegacyBuiltInPracticeSource } from '@/modules/practice/legacy-practice-source';
import { DrizzlePracticeRepository } from '@/modules/practice/practice.repository';
import type { PracticeDraft, PracticeVersion } from '@/modules/practice/practice.schema';
import { PracticeService } from '@/modules/practice/practice.service';
import { ensurePersonalWorkspace } from '@/modules/workspace/personal-workspace';

function normalizeDurationMinutes(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.max(1, Math.round(numeric)) : 10;
}

function equalWeights(count: number): number[] {
  if (count <= 0) {
    throw new Error('At least one rubric criterion is required.');
  }

  const base = Math.floor(100 / count);
  let remainder = 100 - base * count;

  return Array.from({ length: count }, () => {
    const weight = base + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    return weight;
  });
}

function chooseOne<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot choose from an empty question pool.');
  }

  return items[Math.floor(Math.random() * items.length)]!;
}

async function buildRandomizedDraft(templateId: string): Promise<PracticeDraft> {
  const source = await loadLegacyBuiltInPracticeSource(templateId);

  // Preserve the legacy Practice behavior exactly: the old runtime loops every
  // linked evaluation criterion and selects one random question from each pool.
  // `template.question_count` is presentation metadata and did not control that
  // selection loop, so it must not trim the v2 imported criterion set either.
  const selectedPools = source.pools;

  if (selectedPools.length === 0) {
    throw new Error('Built-in practice template has no usable scoring criteria.');
  }

  const weights = equalWeights(selectedPools.length);
  const criterionIds = selectedPools.map(() => randomUUID());
  const durationMinutes = normalizeDurationMinutes(source.template.duration);
  const responseSeconds = Math.max(
    60,
    Math.min(300, Math.round((durationMinutes * 60) / selectedPools.length)),
  );

  const description =
    source.template.description?.trim() ||
    `Practice ${source.template.title} with InterviewGrade.`;
  const scenarioParts = [
    description,
    source.template.role ? `Role: ${source.template.role}.` : null,
    source.template.skill ? `Skill focus: ${source.template.skill}.` : null,
  ].filter(Boolean);

  return {
    title: source.template.title,
    description,
    scenario: scenarioParts.join(' '),
    instructions:
      'Answer each question as if this were a real interview. You will receive live feedback after each response and a structured report when you finish.',
    difficulty: source.template.difficulty ?? null,
    estimatedDurationMinutes: durationMinutes,
    questions: selectedPools.map((pool, index) => {
      const selectedQuestion = chooseOne(pool.questions);
      return {
        id: randomUUID(),
        order: index,
        prompt: selectedQuestion.text,
        guidance: null,
        preparationSeconds: 5,
        responseSeconds,
        rubricCriterionIds: [criterionIds[index]!],
      };
    }),
    rubricCriteria: selectedPools.map((pool, index) => ({
      id: criterionIds[index]!,
      order: index,
      name: pool.criterion.name,
      description:
        pool.criterion.description?.trim() ||
        `Assess the candidate's ${pool.criterion.name}.`,
      weight: weights[index]!,
    })),
  };
}

async function deleteUnclaimedPractice(
  practiceId: string,
  actorUserId: string,
): Promise<void> {
  // A duplicate can only exist during a concurrent first import, before any
  // session references it. Clear the cyclic current-version pointers first,
  // then let the practice cascade delete its versions/questions/rubric.
  await db.transaction(async (tx) => {
    await tx
      .update(practices)
      .set({
        currentDraftVersionId: null,
        currentPublishedVersionId: null,
      })
      .where(
        and(eq(practices.id, practiceId), eq(practices.createdBy, actorUserId)),
      );

    await tx
      .delete(practices)
      .where(
        and(eq(practices.id, practiceId), eq(practices.createdBy, actorUserId)),
      );
  });
}

/**
 * Materialize a legacy built-in Practice template into the candidate's hidden
 * personal workspace, publish a fresh randomized immutable version, and return
 * that version for Session creation.
 *
 * The stable v2 Practice container is reused on later starts. This preserves
 * legacy question randomization without duplicating authored-library entries,
 * while already-started sessions remain pinned to older immutable versions.
 */
export async function prepareBuiltInPracticeVersion(
  participantUserId: string,
  legacyTemplateId: string,
): Promise<PracticeVersion> {
  const draft = await buildRandomizedDraft(legacyTemplateId);
  const workspaceId = await ensurePersonalWorkspace(participantUserId);
  const practiceService = new PracticeService(
    new DrizzlePracticeRepository(participantUserId),
    workspaceId,
    participantUserId,
  );

  let mapping = await findLegacyPracticeImport(
    participantUserId,
    legacyTemplateId,
  );
  let practiceId = mapping?.practiceId ?? null;

  if (practiceId) {
    const existing = await practiceService.getById(practiceId);
    if (!existing) {
      // The FK normally prevents this. Treat any unexpected stale bridge as a
      // hard failure rather than silently creating an unrelated replacement.
      throw new Error('Imported built-in Practice mapping is stale.');
    }

    await practiceService.updateDraft(practiceId, draft);
  } else {
    const created = await practiceService.create(draft);
    const claimed = await claimLegacyPracticeImport(
      participantUserId,
      legacyTemplateId,
      created.id,
    );

    if (claimed) {
      practiceId = created.id;
    } else {
      // Another concurrent first-start won the unique bridge claim. Remove our
      // unused duplicate and reuse/update the winner.
      await deleteUnclaimedPractice(created.id, participantUserId);
      mapping = await findLegacyPracticeImport(
        participantUserId,
        legacyTemplateId,
      );
      if (!mapping) {
        throw new Error('Built-in Practice import could not resolve its bridge.');
      }

      practiceId = mapping.practiceId;
      await practiceService.updateDraft(practiceId, draft);
    }
  }

  if (!practiceId) {
    throw new Error('Built-in Practice import did not produce a v2 Practice.');
  }

  return practiceService.publish(practiceId);
}
