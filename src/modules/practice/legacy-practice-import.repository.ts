import 'server-only';

import { and, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { legacyPracticeImports } from '@/db/schema/legacy-practice-imports';

export type LegacyPracticeImport = {
  participantUserId: string;
  legacyTemplateId: string;
  practiceId: string;
};

export function isLegacyPracticeImportBridgeUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === '42P01' &&
    typeof candidate.message === 'string' &&
    candidate.message.includes('legacy_practice_imports')
  );
}

export async function findLegacyPracticeImport(
  participantUserId: string,
  legacyTemplateId: string,
  database: InterviewGradeDatabase = db,
): Promise<LegacyPracticeImport | null> {
  const [row] = await database
    .select({
      participantUserId: legacyPracticeImports.participantUserId,
      legacyTemplateId: legacyPracticeImports.legacyTemplateId,
      practiceId: legacyPracticeImports.practiceId,
    })
    .from(legacyPracticeImports)
    .where(
      and(
        eq(legacyPracticeImports.participantUserId, participantUserId),
        eq(legacyPracticeImports.legacyTemplateId, legacyTemplateId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function claimLegacyPracticeImport(
  participantUserId: string,
  legacyTemplateId: string,
  practiceId: string,
  database: InterviewGradeDatabase = db,
): Promise<boolean> {
  const [claimed] = await database
    .insert(legacyPracticeImports)
    .values({
      participantUserId,
      legacyTemplateId,
      practiceId,
    })
    .onConflictDoNothing({
      target: [
        legacyPracticeImports.participantUserId,
        legacyPracticeImports.legacyTemplateId,
      ],
    })
    .returning({ practiceId: legacyPracticeImports.practiceId });

  return Boolean(claimed);
}

export async function listLegacyImportedPracticeIds(
  participantUserId: string,
  database: InterviewGradeDatabase = db,
): Promise<Set<string>> {
  const rows = await database
    .select({ practiceId: legacyPracticeImports.practiceId })
    .from(legacyPracticeImports)
    .where(eq(legacyPracticeImports.participantUserId, participantUserId));

  return new Set(rows.map((row) => row.practiceId));
}
