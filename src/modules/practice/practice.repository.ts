import 'server-only';

import { and, asc, desc, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import {
  practiceQuestions,
  practices,
  practiceVersions,
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

type PracticeRow = typeof practices.$inferSelect;
type PracticeVersionRow = typeof practiceVersions.$inferSelect;
type PracticeQuestionRow = typeof practiceQuestions.$inferSelect;
type RubricCriterionRow = typeof rubricCriteria.$inferSelect;

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

function mapSnapshot(
  version: PracticeVersionRow,
  questions: PracticeQuestionRow[],
  criteria: RubricCriterionRow[],
): PracticeDraft {
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

function mapPractice(
  row: PracticeRow,
  snapshot: PracticeDraft,
): Practice {
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

/**
 * Drizzle-backed implementation of the v2 PracticeRepository contract.
 *
 * Reads can be performed without an actor. Mutations are intentionally actor
 * scoped so persistence never reaches into Supabase auth on its own. The
 * application layer is responsible for authenticating/authorizing the caller
 * and constructing this repository with that user's id.
 */
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

    return mapSnapshot(version, questions, criteria);
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

    if (!row) {
      return null;
    }

    return this.hydrateDraftPractice(row);
  }

  async getPublishedBySlug(slug: string): Promise<Practice | null> {
    const [row] = await this.database
      .select()
      .from(practices)
      .where(
        and(eq(practices.shareSlug, slug), eq(practices.status, 'published')),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    if (!row.currentPublishedVersionId) {
      throw new Error(
        `Published practice ${row.id} does not have a published version pointer.`,
      );
    }

    // Public reads intentionally hydrate the immutable published snapshot rather
    // than the creator's potentially newer editable draft.
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
    const draft = practiceDraftSchema.parse(draftInput);
    assertUniqueDraftPositions(draft);

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

      if (!practice) {
        throw new Error('Failed to create practice.');
      }

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
          practiceVersionId: version.id,
          position: criterion.order,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight.toString(),
        })),
      );

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
    const draft = practiceDraftSchema.parse(draftInput);
    assertUniqueDraftPositions(draft);

    await this.database.transaction(async (tx) => {
      const [practice] = await tx
        .select()
        .from(practices)
        .where(eq(practices.id, id))
        .limit(1)
        .for('update');

      if (!practice) {
        throw new Error(`Practice ${id} was not found.`);
      }

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

      // Draft child rows are replaceable because no session may reference a
      // draft version. Published versions are never edited by this method.
      await tx
        .delete(practiceQuestions)
        .where(eq(practiceQuestions.practiceVersionId, draftVersion.id));
      await tx
        .delete(rubricCriteria)
        .where(eq(rubricCriteria.practiceVersionId, draftVersion.id));

      await tx.insert(practiceQuestions).values(
        draft.questions.map((question) => ({
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
          practiceVersionId: draftVersion.id,
          position: criterion.order,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight.toString(),
        })),
      );

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

      if (!practice) {
        throw new Error(`Practice ${id} was not found.`);
      }

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

      const snapshot = mapSnapshot(draftVersion, questions, criteria);
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
        .returning({ id: practiceQuestions.id });

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
        .returning({ id: rubricCriteria.id });

      if (insertedCriteria.length !== criteria.length) {
        throw new Error('Failed to clone published rubric criteria.');
      }

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
