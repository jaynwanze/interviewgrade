import { sql } from 'drizzle-orm';
import {
  check,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { sessionResponses, sessions } from './sessions';

const generatedUuid = sql`extensions.uuid_generate_v4()`;

export const responseEvaluations = pgTable(
  'response_evaluations',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    responseId: uuid('response_id')
      .notNull()
      .references(() => sessionResponses.id, { onDelete: 'cascade' }),
    overallScore: numeric('overall_score', { precision: 5, scale: 2 }).notNull(),
    criterionScores: jsonb('criterion_scores').notNull().default(sql`'[]'::jsonb`),
    summary: text('summary'),
    strengths: jsonb('strengths').notNull().default(sql`'[]'::jsonb`),
    improvements: jsonb('improvements').notNull().default(sql`'[]'::jsonb`),
    recommendation: text('recommendation').notNull(),
    schemaVersion: text('schema_version').notNull(),
    modelMetadata: jsonb('model_metadata').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('response_evaluations_response_id_idx').on(table.responseId),
    unique('response_evaluations_response_schema_unique').on(
      table.responseId,
      table.schemaVersion,
    ),
    check(
      'response_evaluations_score_range',
      sql`${table.overallScore} >= 0 and ${table.overallScore} <= 100`,
    ),
    check(
      'response_evaluations_schema_version_not_blank',
      sql`length(btrim(${table.schemaVersion})) > 0`,
    ),
  ],
);

export const sessionEvaluations = pgTable(
  'session_evaluations',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    overallScore: numeric('overall_score', { precision: 5, scale: 2 }).notNull(),
    criterionScores: jsonb('criterion_scores').notNull().default(sql`'[]'::jsonb`),
    summary: text('summary'),
    strengths: jsonb('strengths').notNull().default(sql`'[]'::jsonb`),
    improvements: jsonb('improvements').notNull().default(sql`'[]'::jsonb`),
    recommendation: text('recommendation').notNull(),
    schemaVersion: text('schema_version').notNull(),
    modelMetadata: jsonb('model_metadata').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('session_evaluations_session_id_idx').on(table.sessionId),
    unique('session_evaluations_session_schema_unique').on(
      table.sessionId,
      table.schemaVersion,
    ),
    check(
      'session_evaluations_score_range',
      sql`${table.overallScore} >= 0 and ${table.overallScore} <= 100`,
    ),
    check(
      'session_evaluations_schema_version_not_blank',
      sql`length(btrim(${table.schemaVersion})) > 0`,
    ),
  ],
);
