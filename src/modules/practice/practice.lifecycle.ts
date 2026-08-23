import 'server-only';

import { and, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { practiceVersions, practices } from '@/db/schema/practices';
import { practiceRunUsage } from '@/db/schema/practice-run-usage';
import { sessions } from '@/db/schema/sessions';

export type PracticeRetireMode = 'deleted' | 'archived';

type RetirePracticeInput = {
  practiceId: string;
  workspaceId: string;
  actorUserId: string;
};

/**
 * Retire an authored Practice without destroying participant history.
 *
 * A Practice is physically deletable only while it is a true unused draft:
 * no published version, no participant session, and no Practice-run ledger
 * history. Everything else is archived so immutable versions, creator Results,
 * participant reports, and usage audit rows remain valid.
 */
export async function retirePractice(
  input: RetirePracticeInput,
  database: InterviewGradeDatabase = db,
): Promise<PracticeRetireMode> {
  const practiceId = input.practiceId.trim();
  const workspaceId = input.workspaceId.trim();
  const actorUserId = input.actorUserId.trim();

  if (!practiceId || !workspaceId || !actorUserId) {
    throw new Error('Practice lifecycle retirement requires an authenticated actor.');
  }

  return database.transaction(async (tx) => {
    const [practice] = await tx
      .select({
        id: practices.id,
        status: practices.status,
        organizationId: practices.organizationId,
        currentPublishedVersionId: practices.currentPublishedVersionId,
      })
      .from(practices)
      .where(
        and(
          eq(practices.id, practiceId),
          eq(practices.organizationId, workspaceId),
        ),
      )
      .limit(1)
      .for('update');

    if (!practice) {
      throw new Error(`Practice ${practiceId} was not found in this workspace.`);
    }

    if (practice.status === 'archived') {
      return 'archived';
    }

    const [[publishedVersion], [session], [usage]] = await Promise.all([
      tx
        .select({ id: practiceVersions.id })
        .from(practiceVersions)
        .where(
          and(
            eq(practiceVersions.practiceId, practiceId),
            eq(practiceVersions.state, 'published'),
          ),
        )
        .limit(1),
      tx
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.practiceId, practiceId))
        .limit(1),
      tx
        .select({ id: practiceRunUsage.id })
        .from(practiceRunUsage)
        .where(eq(practiceRunUsage.practiceId, practiceId))
        .limit(1),
    ]);

    const canHardDelete =
      practice.status === 'draft' &&
      !practice.currentPublishedVersionId &&
      !publishedVersion &&
      !session &&
      !usage;

    if (canHardDelete) {
      const [deleted] = await tx
        .delete(practices)
        .where(
          and(
            eq(practices.id, practiceId),
            eq(practices.organizationId, workspaceId),
          ),
        )
        .returning({ id: practices.id });

      if (!deleted) {
        throw new Error(`Practice ${practiceId} could not be deleted.`);
      }

      return 'deleted';
    }

    const [archived] = await tx
      .update(practices)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(
        and(
          eq(practices.id, practiceId),
          eq(practices.organizationId, workspaceId),
        ),
      )
      .returning({ id: practices.id });

    if (!archived) {
      throw new Error(`Practice ${practiceId} could not be archived.`);
    }

    return 'archived';
  });
}
