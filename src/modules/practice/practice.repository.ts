import 'server-only';

import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import {
  practiceQuestions,
  practices,
  practiceVersions,
  questionRubricCriteria,
  rubricCriteria,
} from '@/db/schema/practices';
import {
  practiceDraftSchema,
  practiceSchema,
  practiceStatusSchema,
  practiceVersionSchema,
  type Practice,
  type PracticeDraft,
  type PracticeRepository,
  type PracticeVersion,
} from '@/modules/practice/practice.schema';

const PUBLISH_WEIGHT_TOTAL = 100;
const PUBLISH_WEIGHT_TOLERANCE = 0.01;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PracticeRow = typeof practices.$inferSelect;
type PracticeVersionRow = typeof practiceVersions.$inferSelect;
type PracticeQuestionRow = typeof practiceQuestions.$inferSelect;
type RubricCriterionRow = typeof rubricCriteria.$inferSelect;
type QuestionRubricCriterionRow = typeof questionRubricCriteria.$inferSelect;

function requireNonEmptyActor(actorUserId?: string): string {
  const actor = actorUserId?.trim();
  if (!actor) {
    throw new Error(
      'An authenticated actor user id is required for practice mutations.',
    );
  }

  return actor;
}

function buildStableShareSlug(title: string, practiceId: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return `${base || 'practice'}-${practiceId.replace(/-/g, '')}`;
}

function normalizedUuid(value?: string): string {
  return value && UUID_PATTERN.test(value) ? value : randomUUID();
}

/**
 * Draft child rows are replaceable, but their ids are part of the authoring
 * contract because question ↔ rubric mappings reference them. Normalize every
 * child to a UUID before persistence and preserve valid ids across draft saves.
 */
function normalizeDraftIdentifiers(draftInput: PracticeDraft): PracticeDraft {
  const parsed = practiceDraftSchema.parse(draftInput);
  const criterionIdMap = new Map<string, string>();
  const seenCriterionIds = new Set<string>();

  const normalizedCriteria = parsed.rubricCriteria.map((criterion) => {
    const id = normalizedUuid(criterion.id);
    if (seenCriterionIds.has(id)) {
      throw new Error(`Duplicate rubric criterion id: ${id}.`);
    }
    seenCriterionIds.add(id);
    if (criterion.id) {
      criterionIdMap.set(criterion.id, id);
    }
    criterionIdMap.set(id, id);
    return { ...criterion, id };
  });

  const allCriterionIds = normalizedCriteria.map((criterion) => criterion.id!);
  const seenQuestionIds = new Set<string>();

  const normalizedQuestions = parsed.questions.map((question) => {
    const id = normalizedUuid(question.id);
    if (seenQuestionIds.has(id)) {
      throw new Error(`Duplicate practice question id: ${id}.`);
    }
    seenQuestionIds.add(id);

    const requestedIds = question.rubricCriterionIds ?? allCriterionIds;
    const mappedIds = requestedIds.map((criterionId) => {
      const mapped = criterionIdMap.get(criterionId);
      if (!mapped) {
        throw new Error(
          `Question ${question.order} references unknown rubric criterion ${criterionId}.`,
        );
      }
      return mapped;
    });
    const rubricCriterionIds = Array.from(new Set(mappedIds));

    if (rubricCriterionIds.length === 0) {
      throw new Error('Every practice question must map to at least one rubric criterion.');
    }

    return { ...question, id, rubricCriterionIds };
  });

  return practiceDraftSchema.parse({
    ...parsed,
    questions: normalizedQuestions,
    rubricCriteria: normalizedCriteria,
  });
}

function assertUniqueDraftPositions(draft: PracticeDraft): void {
  const questionPositions = new Set<number>();
  for (const question of draft.questions) {
    if (questionPositions.has(question.order)) {
      throw new Error(`Duplicate practice question order: ${question.order}.`);
    }
    questionPositions.add(question.order);
  }

  const criterionPositions = new Set<number>();
  for (const criterion of draft.rubricCriteria) {
    if (criterionPositions.has(criterion.order)) {
      throw new Error(`Duplicate rubric criterion order: ${criterion.order}.`);
    }
    criterionPositions.add(criterion.order);
  }
}

function assertDraftMappings(
  draft: PracticeDraft,
  requireEveryCriterionUsed: boolean,
): void {
  const criterionIds = new Set(
    draft.rubricCriteria.map((criterion) => {
      if (!criterion.id) {
        throw new Error('Rubric criteria must have runtime identifiers.');
      }
      return criterion.id;
    }),
  );
  const usedCriterionIds = new Set<string>();

  for (const question of draft.questions) {
    const mappedIds = question.rubricCriterionIds ?? [];
    if (mappedIds.length === 0) {
      throw new Error(
        `Question ${question.order + 1} must map to at least one rubric criterion.`,
      );
    }

    for (const criterionId of mappedIds) {
      if (!criterionIds.has(criterionId)) {
        throw new Error(
          `Question ${question.order + 1} references an unknown rubric criterion.`,
        );
      }
      usedCriterionIds.add(criterionId);
    }
  }

  if (requireEveryCriterionUsed) {
    const unused = draft.rubricCriteria.filter(
      (criterion) => criterion.id && !usedCriterionIds.has(criterion.id),
    );
    if (unused.length > 0) {
      throw new Error(
        `Every published rubric criterion must be mapped to at least one question. Unused: ${unused
          .map((criterion) => criterion.name)
          .join(', ')}.`,
      );
    }
  }
}

function assertPublishableRubric(criteria: RubricCriterionRow[]): void {
  const weights = criteria.map((criterion) => Number(criterion.weight));

  if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
    throw new Error('Every published rubric criterion must have a positive weight.');
  }

  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - PUBLISH_WEIGHT_TOTAL) > PUBLISH_WEIGHT_TOLERANCE) {
    throw new Error(
      `Published rubric weights must total ${PUBLISH_WEIGHT_TOTAL}; received ${total}.`,
    );
  }
}

/**
 * Historical versions created before mappings existed have no join rows. For
 * those versions, preserve the old behavior by treating every question as
 * mapped to every rubric criterion. New authoring never persists an empty
 * mapping for a question, so a missing row set remains an unambiguous legacy
 * signal.
 */
function resolveEffectiveMappings(
  questions: PracticeQuestionRow[],
  criteria: RubricCriterionRow[],
  mappings: QuestionRubricCriterionRow[],
): QuestionRubricCriterionRow[] {
  const questionIds = new Set(questions.map((question) => question.id));
  const criterionIds = new Set(criteria.map((criterion) => criterion.id));
  const mappedByQuestion = new Map<string, string[]>();

  for (const mapping of mappings) {
    if (!questionIds.has(mapping.questionId) || !criterionIds.has(mapping.rubricCriterionId)) {
      throw new Error('Question rubric mapping crosses practice-version boundaries.');
    }
    const ids = mappedByQuestion.get(mapping.questionId) ?? [];
    ids.push(mapping.rubricCriterionId);
    mappedByQuestion.set(mapping.questionId, ids);
  }

  return questions.flatMap((question) => {
    const explicitIds = mappedByQuestion.get(question.id);
    const effectiveIds =
      explicitIds && explicitIds.length > 0
        ? explicitIds
        : criteria.map((criterion) => criterion.id);

    return effectiveIds.map((rubricCriterionId) => ({
      questionId: question.id,
      rubricCriterionId,
    }));
  });
}

function mapSnapshot(
  version: PracticeVersionRow,
  questions: PracticeQuestionRow[],
  criteria: RubricCriterionRow[],
  mappings: QuestionRubricCriterionRow[],
): PracticeDraft {
  const effectiveMappings = resolveEffectiveMappings(questions, criteria, mappings);
  const mappedByQuestion = new Map<string, string[]>();
  for (const mapping of effectiveMappings) {
    const ids = mappedByQuestion.get(mapping.questionId) ?? [];
    ids.push(mapping.rubricCriterionId);
    mappedByQuestion.set(mapping.questionId, ids);
  }

  return practiceDraftSchema.parse({
    title: version.title,
    description: version.description,
    scenario: version.scenario,
    instructions: version.instructions,
    difficulty: version.difficulty,
    estimatedDurationMinutes: version.estimatedDurationMinutes,
    questions: questions.map((question) => ({
      id: question.id,
      order: question.position,
      prompt: question.prompt,
      guidance: question.guidance,
      preparationSeconds: question.preparationSeconds,
      responseSeconds: question.maxResponseSeconds,
      rubricCriterionIds: mappedByQuestion.get(question.id) ?? [],
    })),
    rubricCriteria: criteria.map((criterion) => ({
      id: criterion.id,
      order: criterion.position,
      name: criterion.name,
      description: criterion.description,
      weight: Number(criterion.weight),
    })),
  });
}

function mapPractice(row: PracticeRow, snapshot: PracticeDraft): Practice {
  return practiceSchema.parse({
    id: row.id,
    ownerOrganizationId: row.organizationId,
    status: practiceStatusSchema.parse(row.status),
    shareSlug: row.shareSlug,
    currentPublishedVersionId: row.currentPublishedVersionId,
    draft: snapshot,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function draftMappingValues(draft: PracticeDraft) {
  return draft.questions.flatMap((question) =>
    (question.rubricCriterionIds ?? []).map((rubricCriterionId) => ({
      questionId: question.id!,
      rubricCriterionId,
    })),
  );
}

export class DrizzlePracticeRepository implements PracticeRepository {
  constructor(
    private readonly actorUserId?: string,
    private readonly database: InterviewGradeDatabase = db,
  ) {}

  private async loadSnapshot(versionId: string): Promise<PracticeDraft> {
    const [version] = await this.database
      .select()
      .from(practiceVersions)
      .where(eq(practiceVersions.id, versionId))
      .limit(1);

    if (!version) {
      throw new Error(`Practice version ${versionId} was not found.`);
    }

    const [questions, criteria] = await Promise.all([
      this.database
        .select()
        .from(practiceQuestions)
        .where(eq(practiceQuestions.practiceVersionId, versionId))
        .orderBy(asc(practiceQuestions.position)),
      this.database
        .select()
        .from(rubricCriteria)
        .where(eq(rubricCriteria.practiceVersionId, versionId))
        .orderBy(asc(rubricCriteria.position)),
    ]);

    const mappings =
      questions.length === 0
        ? []
        : await this.database
            .select()
            .from(questionRubricCriteria)
            .where(
              inArray(
                questionRubricCriteria.questionId,
                questions.map((question) => question.id),
              ),
            );

    return mapSnapshot(version, questions, criteria, mappings);
  }

  private async hydrateDraftPractice(row: PracticeRow): Promise<Practice> {
    if (!row.currentDraftVersionId) {
      throw new Error(`Practice ${row.id} does not have a current draft version.`);
    }

    const snapshot = await this.loadSnapshot(row.currentDraftVersionId);
    return mapPractice(row, snapshot);
  }

  async getById(id: string): Promise<Practice | null> {
    const [row] = await this.database
      .select()
      .from(practices)
      .where(eq(practices.id, id))
      .limit(1);

    if (!row) return null;
    return this.hydrateDraftPractice(row);
  }

  async getPublishedBySlug(slug: string): Promise<Practice | null> {
    const [row] = await this.database
      .select()
      .from(practices)
      .where(and(eq(practices.shareSlug, slug), eq(practices.status, 'published')))
      .limit(1);

    if (!row) return null;
    if (!row.currentPublishedVersionId) {
      throw new Error(
        `Published practice ${row.id} does not have a published version pointer.`,
      );
    }

    const snapshot = await this.loadSnapshot(row.currentPublishedVersionId);
    return mapPractice(row, snapshot);
  }

  async listByOrganization(organizationId: string): Promise<Practice[]> {
    const rows = await this.database
      .select()
      .from(practices)
      .where(eq(practices.organizationId, organizationId))
      .orderBy(desc(practices.updatedAt));

    return Promise.all(rows.map((row) => this.hydrateDraftPractice(row)));
  }

  async create(
    organizationId: string,
    draftInput: PracticeDraft,
  ): Promise<Practice> {
    const actorUserId = requireNonEmptyActor(this.actorUserId);
    const draft = normalizeDraftIdentifiers(draftInput);
    assertUniqueDraftPositions(draft);
    assertDraftMappings(draft, false);

    const practiceId = await this.database.transaction(async (tx) => {
      const [practice] = await tx
        .insert(practices)
        .values({
          organizationId,
          createdBy: actorUserId,
          title: draft.title,
          description: draft.description,
          status: 'draft',
        })
        .returning({ id: practices.id });

      if (!practice) throw new Error('Failed to create practice.');

      const [version] = await tx
        .insert(practiceVersions)
        .values({
          practiceId: practice.id,
          version: 1,
          state: 'draft',
          title: draft.title,
          description: draft.description,
          scenario: draft.scenario,
          instructions: draft.instructions,
          difficulty: draft.difficulty,
          estimatedDurationMinutes: draft.estimatedDurationMinutes,
          createdBy: actorUserId,
        })
        .returning({ id: practiceVersions.id });

      if (!version) {
        throw new Error('Failed to create initial practice draft version.');
      }

      await tx.insert(practiceQuestions).values(
        draft.questions.map((question) => ({
          id: question.id!,
          practiceVersionId: version.id,
          position: question.order,
          prompt: question.prompt,
          guidance: question.guidance,
          preparationSeconds: question.preparationSeconds,
          maxResponseSeconds: question.responseSeconds,
        })),
      );

      await tx.insert(rubricCriteria).values(
        draft.rubricCriteria.map((criterion) => ({
          id: criterion.id!,
          practiceVersionId: version.id,
          position: criterion.order,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight.toString(),
        })),
      );

      await tx.insert(questionRubricCriteria).values(draftMappingValues(draft));

      await tx
        .update(practices)
        .set({
          currentDraftVersionId: version.id,
          shareSlug: buildStableShareSlug(draft.title, practice.id),
          updatedAt: new Date(),
        })
        .where(eq(practices.id, practice.id));

      return practice.id;
    });

    const created = await this.getById(practiceId);
    if (!created) {
      throw new Error(`Created practice ${practiceId} could not be reloaded.`);
    }
    return created;
  }

  async updateDraft(id: string, draftInput: PracticeDraft): Promise<Practice> {
    requireNonEmptyActor(this.actorUserId);
    const draft = normalizeDraftIdentifiers(draftInput);
    assertUniqueDraftPositions(draft);
    assertDraftMappings(draft, false);

    await this.database.transaction(async (tx) => {
      const [practice] = await tx
        .select()
        .from(practices)
        .where(eq(practices.id, id))
        .limit(1)
        .for('update');

      if (!practice) throw new Error(`Practice ${id} was not found.`);
      if (practice.status === 'archived') {
        throw new Error('Archived practices cannot be edited.');
      }
      if (!practice.currentDraftVersionId) {
        throw new Error(`Practice ${id} does not have a current draft version.`);
      }

      const [draftVersion] = await tx
        .select()
        .from(practiceVersions)
        .where(
          and(
            eq(practiceVersions.id, practice.currentDraftVersionId),
            eq(practiceVersions.practiceId, id),
          ),
        )
        .limit(1)
        .for('update');

      if (!draftVersion || draftVersion.state !== 'draft') {
        throw new Error(`Practice ${id} does not have an editable draft version.`);
      }

      await tx
        .update(practiceVersions)
        .set({
          title: draft.title,
          description: draft.description,
          scenario: draft.scenario,
          instructions: draft.instructions,
          difficulty: draft.difficulty,
          estimatedDurationMinutes: draft.estimatedDurationMinutes,
        })
        .where(eq(practiceVersions.id, draftVersion.id));

      // Deleting draft questions cascades their join rows. No session may point
      // at a draft version, so the child set can be safely replaced while the
      // same UUIDs are re-used for authoring stability.
      await tx
        .delete(practiceQuestions)
        .where(eq(practiceQuestions.practiceVersionId, draftVersion.id));
      await tx
        .delete(rubricCriteria)
        .where(eq(rubricCriteria.practiceVersionId, draftVersion.id));

      await tx.insert(practiceQuestions).values(
        draft.questions.map((question) => ({
          id: question.id!,
          practiceVersionId: draftVersion.id,
          position: question.order,
          prompt: question.prompt,
          guidance: question.guidance,
          preparationSeconds: question.preparationSeconds,
          maxResponseSeconds: question.responseSeconds,
        })),
      );

      await tx.insert(rubricCriteria).values(
        draft.rubricCriteria.map((criterion) => ({
          id: criterion.id!,
          practiceVersionId: draftVersion.id,
          position: criterion.order,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight.toString(),
        })),
      );

      await tx.insert(questionRubricCriteria).values(draftMappingValues(draft));

      await tx
        .update(practices)
        .set({
          title: draft.title,
          description: draft.description,
          updatedAt: new Date(),
        })
        .where(eq(practices.id, id));
    });

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Updated practice ${id} could not be reloaded.`);
    }
    return updated;
  }

  async publish(id: string): Promise<PracticeVersion> {
    const actorUserId = requireNonEmptyActor(this.actorUserId);

    return this.database.transaction(async (tx) => {
      const [practice] = await tx
        .select()
        .from(practices)
        .where(eq(practices.id, id))
        .limit(1)
        .for('update');

      if (!practice) throw new Error(`Practice ${id} was not found.`);
      if (practice.status === 'archived') {
        throw new Error('Archived practices cannot be published.');
      }
      if (!practice.currentDraftVersionId) {
        throw new Error(`Practice ${id} does not have a current draft version.`);
      }

      const [draftVersion] = await tx
        .select()
        .from(practiceVersions)
        .where(
          and(
            eq(practiceVersions.id, practice.currentDraftVersionId),
            eq(practiceVersions.practiceId, id),
          ),
        )
        .limit(1)
        .for('update');

      if (!draftVersion || draftVersion.state !== 'draft') {
        throw new Error(`Practice ${id} does not have a publishable draft.`);
      }

      const [questions, criteria] = await Promise.all([
        tx
          .select()
          .from(practiceQuestions)
          .where(eq(practiceQuestions.practiceVersionId, draftVersion.id))
          .orderBy(asc(practiceQuestions.position)),
        tx
          .select()
          .from(rubricCriteria)
          .where(eq(rubricCriteria.practiceVersionId, draftVersion.id))
          .orderBy(asc(rubricCriteria.position)),
      ]);

      if (questions.length === 0) {
        throw new Error('A practice must contain at least one question to publish.');
      }
      if (criteria.length === 0) {
        throw new Error(
          'A practice must contain at least one rubric criterion to publish.',
        );
      }
      assertPublishableRubric(criteria);

      const rawMappings = await tx
        .select()
        .from(questionRubricCriteria)
        .where(
          inArray(
            questionRubricCriteria.questionId,
            questions.map((question) => question.id),
          ),
        );
      const effectiveMappings = resolveEffectiveMappings(
        questions,
        criteria,
        rawMappings,
      );
      const snapshot = mapSnapshot(
        draftVersion,
        questions,
        criteria,
        effectiveMappings,
      );
      assertDraftMappings(snapshot, true);

      const publishedAt = new Date();
      await tx
        .update(practiceVersions)
        .set({ state: 'published', publishedAt })
        .where(eq(practiceVersions.id, draftVersion.id));

      const [nextDraftVersion] = await tx
        .insert(practiceVersions)
        .values({
          practiceId: id,
          version: draftVersion.version + 1,
          state: 'draft',
          title: draftVersion.title,
          description: draftVersion.description,
          scenario: draftVersion.scenario,
          instructions: draftVersion.instructions,
          difficulty: draftVersion.difficulty,
          estimatedDurationMinutes: draftVersion.estimatedDurationMinutes,
          generationMetadata: draftVersion.generationMetadata,
          createdBy: actorUserId,
        })
        .returning({ id: practiceVersions.id });

      if (!nextDraftVersion) {
        throw new Error('Failed to create the next editable practice draft.');
      }

      const insertedQuestions = await tx
        .insert(practiceQuestions)
        .values(
          questions.map((question) => ({
            practiceVersionId: nextDraftVersion.id,
            position: question.position,
            prompt: question.prompt,
            guidance: question.guidance,
            sampleAnswer: question.sampleAnswer,
            preparationSeconds: question.preparationSeconds,
            maxResponseSeconds: question.maxResponseSeconds,
          })),
        )
        .returning({ id: practiceQuestions.id, position: practiceQuestions.position });

      if (insertedQuestions.length !== questions.length) {
        throw new Error('Failed to clone published practice questions.');
      }

      const insertedCriteria = await tx
        .insert(rubricCriteria)
        .values(
          criteria.map((criterion) => ({
            practiceVersionId: nextDraftVersion.id,
            name: criterion.name,
            description: criterion.description,
            weight: criterion.weight,
            position: criterion.position,
            rubricLevels: criterion.rubricLevels,
          })),
        )
        .returning({ id: rubricCriteria.id, position: rubricCriteria.position });

      if (insertedCriteria.length !== criteria.length) {
        throw new Error('Failed to clone published rubric criteria.');
      }

      const questionPositionById = new Map(
        questions.map((question) => [question.id, question.position] as const),
      );
      const criterionPositionById = new Map(
        criteria.map((criterion) => [criterion.id, criterion.position] as const),
      );
      const nextQuestionIdByPosition = new Map(
        insertedQuestions.map((question) => [question.position, question.id] as const),
      );
      const nextCriterionIdByPosition = new Map(
        insertedCriteria.map((criterion) => [criterion.position, criterion.id] as const),
      );

      const clonedMappings = effectiveMappings.map((mapping) => {
        const questionPosition = questionPositionById.get(mapping.questionId);
        const criterionPosition = criterionPositionById.get(mapping.rubricCriterionId);
        const questionId =
          questionPosition === undefined
            ? undefined
            : nextQuestionIdByPosition.get(questionPosition);
        const rubricCriterionId =
          criterionPosition === undefined
            ? undefined
            : nextCriterionIdByPosition.get(criterionPosition);

        if (!questionId || !rubricCriterionId) {
          throw new Error('Failed to clone question rubric mappings.');
        }
        return { questionId, rubricCriterionId };
      });

      await tx.insert(questionRubricCriteria).values(clonedMappings);

      await tx
        .update(practices)
        .set({
          status: 'published',
          currentPublishedVersionId: draftVersion.id,
          currentDraftVersionId: nextDraftVersion.id,
          shareSlug:
            practice.shareSlug || buildStableShareSlug(draftVersion.title, id),
          title: draftVersion.title,
          description: draftVersion.description,
          updatedAt: publishedAt,
        })
        .where(eq(practices.id, id));

      return practiceVersionSchema.parse({
        id: draftVersion.id,
        practiceId: id,
        version: draftVersion.version,
        publishedAt,
        snapshot,
      });
    });
  }
}

export function createDrizzlePracticeRepository(
  actorUserId?: string,
  database: InterviewGradeDatabase = db,
): PracticeRepository {
  return new DrizzlePracticeRepository(actorUserId, database);
}
