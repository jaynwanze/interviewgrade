import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  practiceQuestions,
  practices,
  practiceVersions,
} from './practices';

const generatedUuid = sql`extensions.uuid_generate_v4()`;

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    practiceId: uuid('practice_id')
      .notNull()
      .references(() => practices.id, { onDelete: 'restrict' }),
    practiceVersionId: uuid('practice_version_id').notNull(),
    participantUserId: uuid('participant_user_id'),
    participantName: text('participant_name'),
    participantEmail: text('participant_email'),
    status: text('status').notNull().default('created'),
    currentQuestionPosition: integer('current_question_position')
      .notNull()
      .default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.practiceId, table.practiceVersionId],
      foreignColumns: [practiceVersions.practiceId, practiceVersions.id],
      name: 'sessions_practice_version_fk',
    }).onDelete('restrict'),
    index('sessions_practice_id_idx').on(table.practiceId),
    index('sessions_practice_version_id_idx').on(table.practiceVersionId),
    index('sessions_participant_user_id_idx').on(table.participantUserId),
    index('sessions_created_at_idx').on(table.createdAt.desc()),
    check(
      'sessions_status_check',
      sql`${table.status} in ('created', 'in_progress', 'completed', 'abandoned')`,
    ),
    check(
      'sessions_question_position_nonnegative',
      sql`${table.currentQuestionPosition} >= 0`,
    ),
    check(
      'sessions_completion_state_check',
      sql`(${table.status} = 'completed' and ${table.completedAt} is not null) or (${table.status} <> 'completed')`,
    ),
  ],
);

export const sessionResponses = pgTable(
  'session_responses',
  {
    id: uuid('id').primaryKey().default(generatedUuid),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => practiceQuestions.id, { onDelete: 'restrict' }),
    questionPosition: integer('question_position').notNull(),
    transcript: text('transcript').notNull(),
    audioObjectPath: text('audio_object_path'),
    durationSeconds: integer('duration_seconds'),
    attemptNumber: integer('attempt_number').notNull().default(1),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('session_responses_session_id_idx').on(table.sessionId),
    index('session_responses_question_id_idx').on(table.questionId),
    unique('session_responses_attempt_unique').on(
      table.sessionId,
      table.questionId,
      table.attemptNumber,
    ),
    check(
      'session_responses_question_position_nonnegative',
      sql`${table.questionPosition} >= 0`,
    ),
    check(
      'session_responses_transcript_not_blank',
      sql`length(btrim(${table.transcript})) > 0`,
    ),
    check(
      'session_responses_duration_nonnegative',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`,
    ),
    check(
      'session_responses_attempt_positive',
      sql`${table.attemptNumber} > 0`,
    ),
  ],
);
