import 'server-only';

import { and, eq } from 'drizzle-orm';
import { v5 as uuidv5 } from 'uuid';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { workspaceMembers, workspaces } from '@/db/schema/workspaces';

const PERSONAL_WORKSPACE_NAMESPACE = '9f403b5b-7e70-4baa-a991-4ff7b82cc744';
const PERSONAL_WORKSPACE_TITLE = 'Personal Workspace';

/**
 * Personal workspace ids are deterministic so an individual account can never
 * accidentally resolve to one of the employer organizations they may already
 * own in the legacy product.
 */
export function getPersonalWorkspaceId(userId: string): string {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('A user id is required to resolve a personal workspace.');
  }

  return uuidv5(normalizedUserId, PERSONAL_WORKSPACE_NAMESPACE);
}

/**
 * Ensure the invisible personal workspace used by candidate-first v2 exists.
 *
 * The physical tables remain `organizations` / `organization_members` during
 * migration, but callers only deal in workspace language. No organization
 * picker or employer onboarding is required for individual users.
 */
export async function ensurePersonalWorkspace(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<string> {
  const normalizedUserId = userId.trim();
  const workspaceId = getPersonalWorkspaceId(normalizedUserId);

  await database.transaction(async (tx) => {
    await tx
      .insert(workspaces)
      .values({
        id: workspaceId,
        title: PERSONAL_WORKSPACE_TITLE,
        createdBy: normalizedUserId,
      })
      .onConflictDoNothing({ target: workspaces.id });

    const [workspace] = await tx
      .select({ createdBy: workspaces.createdBy })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace || workspace.createdBy !== normalizedUserId) {
      throw new Error('Personal workspace ownership could not be verified.');
    }

    await tx
      .insert(workspaceMembers)
      .values({
        organizationId: workspaceId,
        memberId: normalizedUserId,
        memberRole: 'owner',
      })
      .onConflictDoNothing({
        target: [workspaceMembers.organizationId, workspaceMembers.memberId],
      });

    const [membership] = await tx
      .select({ role: workspaceMembers.memberRole })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.organizationId, workspaceId),
          eq(workspaceMembers.memberId, normalizedUserId),
        ),
      )
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      throw new Error('Personal workspace membership could not be verified.');
    }
  });

  return workspaceId;
}
