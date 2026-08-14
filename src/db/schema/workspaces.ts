import {
  bigint,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * v2 calls these workspaces in product/application language while the physical
 * tables remain the legacy `organizations` tables during the strangler
 * migration. Keeping that translation here prevents employer-era naming from
 * leaking back into candidate-first application code.
 */
export const workspaceMemberRole = pgEnum('organization_member_role', [
  'owner',
  'admin',
  'member',
  'readonly',
]);

export const workspaces = pgTable('organizations', {
  id: uuid('id').primaryKey(),
  title: varchar('title').notNull().default('Personal Workspace'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  'organization_members',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    organizationId: uuid('organization_id').notNull(),
    memberId: uuid('member_id').notNull(),
    memberRole: workspaceMemberRole('member_role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('organization_members_organization_member_unique').on(
      table.organizationId,
      table.memberId,
    ),
  ],
);
