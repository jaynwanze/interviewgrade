import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

const generatedUuid = sql`extensions.uuid_generate_v4()`;

export const practices = pgTable(
  'practices',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    organizationId: uuid('organization_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('draft'),
    shareSlug: text('share_slug').unique(),
    currentDraftVersionId: uuid('current_draft_version_id'),
    currentPublishedVersionId: uuid('current_published_version_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('practices_organization_id_idx').on(table.organizationId),
    index('practices_created_by_idx').on(table.createdBy),
    check('practices_title_not_blank', sql`length(btrim(${table.title})) > 0`),
    check(
      'practices_status_check',
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
  ],
);

export const practiceVersions = pgTable(
  'practice_versions',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    practiceId: uuid('practice_id')
      .notNull()
      .references(() => practices.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    state: text('state').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    scenario: text('scenario').notNull(),
    instructions: text('instructions'),
    difficulty: text('difficulty'),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    generationMetadata: jsonb('generation_metadata'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('practice_versions_practice_id_idx').on(table.practiceId),
    unique('practice_versions_practice_version_unique').on(
      table.practiceId,
      table.version,
    ),
    unique('practice_versions_practice_id_id_unique').on(
      table.practiceId,
      table.id,
    ),
    check('practice_versions_version_positive', sql`${table.version} > 0`),
    check(
      'practice_versions_state_check',
      sql`${table.state} in ('draft', 'published')`,
    ),
    check(
      'practice_versions_title_not_blank',
      sql`length(btrim(${table.title})) > 0`,
    ),
    check(
      'practice_versions_description_not_blank',
      sql`length(btrim(${table.description})) > 0`,
    ),
    check(
      'practice_versions_scenario_not_blank',
      sql`length(btrim(${table.scenario})) > 0`,
    ),
    check(
      'practice_versions_duration_positive',
      sql`${table.estimatedDurationMinutes} is null or ${table.estimatedDurationMinutes} > 0`,
    ),
    check(
      'practice_versions_publish_state_check',
      sql`(${table.state} = 'draft' and ${table.publishedAt} is null) or (${table.state} = 'published' and ${table.publishedAt} is not null)`,
    ),
  ],
);

export const practiceQuestions = pgTable(
  'practice_questions',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    practiceVersionId: uuid('practice_version_id')
      .notNull()
      .references(() => practiceVersions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    prompt: text('prompt').notNull(),
    guidance: text('guidance'),
    sampleAnswer: text('sample_answer'),
    preparationSeconds: integer('preparation_seconds'),
    maxResponseSeconds: integer('max_response_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('practice_questions_version_id_idx').on(table.practiceVersionId),
    unique('practice_questions_version_position_unique').on(
      table.practiceVersionId,
      table.position,
    ),
    check(
      'practice_questions_position_nonnegative',
      sql`${table.position} >= 0`,
    ),
    check(
      'practice_questions_prompt_not_blank',
      sql`length(btrim(${table.prompt})) > 0`,
    ),
    check(
      'practice_questions_preparation_nonnegative',
      sql`${table.preparationSeconds} is null or ${table.preparationSeconds} >= 0`,
    ),
    check(
      'practice_questions_response_positive',
      sql`${table.maxResponseSeconds} is null or ${table.maxResponseSeconds} > 0`,
    ),
  ],
);

export const rubricCriteria = pgTable(
  'rubric_criteria',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    practiceVersionId: uuid('practice_version_id')
      .notNull()
      .references(() => practiceVersions.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
    position: integer('position').notNull(),
    rubricLevels: jsonb('rubric_levels').notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('rubric_criteria_version_id_idx').on(table.practiceVersionId),
    unique('rubric_criteria_version_position_unique').on(
      table.practiceVersionId,
      table.position,
    ),
    check(
      'rubric_criteria_name_not_blank',
      sql`length(btrim(${table.name})) > 0`,
    ),
    check(
      'rubric_criteria_description_not_blank',
      sql`length(btrim(${table.description})) > 0`,
    ),
    check(
      'rubric_criteria_weight_range',
      sql`${table.weight} > 0 and ${table.weight} <= 100`,
    ),
    check('rubric_criteria_position_nonnegative', sql`${table.position} >= 0`),
  ],
);

export const questionRubricCriteria = pgTable(
  'question_rubric_criteria',
  {
    questionId: uuid('question_id')
      .notNull()
      .references(() => practiceQuestions.id, { onDelete: 'cascade' }),
    rubricCriterionId: uuid('rubric_criterion_id')
      .notNull()
      .references(() => rubricCriteria.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.questionId, table.rubricCriterionId] }),
    index('question_rubric_criteria_criterion_id_idx').on(
      table.rubricCriterionId,
    ),
  ],
);

/**
 * The SQL baseline migration also enforces composite foreign keys from
 * practices.current_*_version_id back to the same practice. Those cyclic
 * constraints intentionally remain migration-owned so this file stays free of
 * circular table initialization while preserving the exact database invariant.
 */
