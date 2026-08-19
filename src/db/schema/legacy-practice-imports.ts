import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { practices } from './practices';

/**
 * Transitional bridge used while the built-in Practice catalog still lives in
 * legacy Supabase tables. Each candidate gets at most one stable v2 Practice
 * container per legacy template; every new start can publish a fresh immutable
 * version with a newly randomized question selection.
 */
export const legacyPracticeImports = pgTable(
  'legacy_practice_imports',
  {
    participantUserId: uuid('participant_user_id').notNull(),
    legacyTemplateId: text('legacy_template_id').notNull(),
    practiceId: uuid('practice_id')
      .notNull()
      .references(() => practices.id, { onDelete: 'cascade' }),
    importedAt: timestamp('imported_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.participantUserId, table.legacyTemplateId],
    }),
    unique('legacy_practice_imports_participant_practice_unique').on(
      table.participantUserId,
      table.practiceId,
    ),
    index('legacy_practice_imports_practice_id_idx').on(table.practiceId),
    check(
      'legacy_practice_imports_template_not_blank',
      sql`length(btrim(${table.legacyTemplateId})) > 0`,
    ),
  ],
);
