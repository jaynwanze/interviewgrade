import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { practices } from './practices';
import { sessions } from './sessions';

export const practiceRunUsage = pgTable(
  'practice_run_usage',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    practiceId: uuid('practice_id')
      .notNull()
      .references(() => practices.id, { onDelete: 'restrict' }),
    funderUserId: uuid('funder_user_id').notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('practice_run_usage_session_id_key').on(table.sessionId),
    index('practice_run_usage_funder_consumed_at_idx').on(
      table.funderUserId,
      table.consumedAt,
    ),
  ],
);
