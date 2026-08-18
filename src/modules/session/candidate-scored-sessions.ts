import 'server-only';

import { cache } from 'react';
import { and, desc, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { sessionEvaluations } from '@/db/schema/evaluations';
import { practiceVersions } from '@/db/schema/practices';
import { sessions } from '@/db/schema/sessions';
import { criterionScoreSchema } from '@/modules/evaluation/evaluation.schema';

const criterionScoresSchema = criterionScoreSchema.array();

export type CandidateScoredSession = {
  sessionId: string;
  practiceId: string;
  title: string;
  completedAt: Date;
  overallScore: number;
  criterionScores: ReturnType<typeof criterionScoresSchema.parse>;
  recommendation: string;
};

/**
 * Load only the newest persisted evaluation for each completed candidate session.
 *
 * Session evaluations are append-only and schema-versioned. `DISTINCT ON` keeps
 * older versions available for reproducible reports without materializing every
 * historical schema version on dashboard reads.
 */
export async function loadCandidateScoredSessions(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<CandidateScoredSession[]> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('A candidate user id is required to load scored sessions.');
  }

  const rows = await database
    .selectDistinctOn([sessionEvaluations.sessionId], {
      sessionId: sessionEvaluations.sessionId,
      practiceId: sessions.practiceId,
      title: practiceVersions.title,
      completedAt: sessions.completedAt,
      overallScore: sessionEvaluations.overallScore,
      criterionScores: sessionEvaluations.criterionScores,
      recommendation: sessionEvaluations.recommendation,
      evaluationCreatedAt: sessionEvaluations.createdAt,
    })
    .from(sessionEvaluations)
    .innerJoin(sessions, eq(sessions.id, sessionEvaluations.sessionId))
    .innerJoin(
      practiceVersions,
      eq(practiceVersions.id, sessions.practiceVersionId),
    )
    .where(
      and(
        eq(sessions.participantUserId, normalizedUserId),
        eq(sessions.status, 'completed'),
      ),
    )
    .orderBy(sessionEvaluations.sessionId, desc(sessionEvaluations.createdAt));

  return rows
    .flatMap((row) => {
      if (!row.completedAt) {
        return [];
      }

      const parsedCriteria = criterionScoresSchema.safeParse(row.criterionScores);

      return [
        {
          sessionId: row.sessionId,
          practiceId: row.practiceId,
          title: row.title,
          completedAt: row.completedAt,
          overallScore: Number(row.overallScore),
          criterionScores: parsedCriteria.success ? parsedCriteria.data : [],
          recommendation: row.recommendation,
        } satisfies CandidateScoredSession,
      ];
    })
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
}

/**
 * React request cache: Progress and Analytics can keep separate Suspense
 * boundaries while sharing the same scored-session database read in one render.
 */
export const getCandidateScoredSessions = cache(
  async (userId: string): Promise<CandidateScoredSession[]> =>
    loadCandidateScoredSessions(userId),
);
