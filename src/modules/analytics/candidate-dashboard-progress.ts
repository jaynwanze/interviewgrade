import 'server-only';

import { desc, eq, sql } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { practiceVersions } from '@/db/schema/practices';
import { sessions } from '@/db/schema/sessions';
import type {
  CandidateSessionHistoryItem,
  CandidateSessionHistorySummary,
} from '@/modules/session/candidate-session-history';
import {
  getCandidateScoredSessions,
  loadCandidateScoredSessions,
} from '@/modules/session/candidate-scored-sessions';
import { sessionStatusSchema } from '@/modules/session/session.schema';

export type CandidateDashboardProgress = {
  summary: CandidateSessionHistorySummary;
  recentSessions: CandidateSessionHistoryItem[];
};

/**
 * Dashboard-specific progress read.
 *
 * Counts and recent rows stay lightweight while score aggregates reuse the same
 * request-cached latest-evaluation population consumed by richer v2 analytics.
 */
export async function getCandidateDashboardProgress(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<CandidateDashboardProgress> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('A candidate user id is required to load dashboard progress.');
  }

  const [countRow, recentRows, scoredSessions] = await Promise.all([
    database
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${sessions.status} = 'completed')::int`,
        inProgress: sql<number>`count(*) filter (where ${sessions.status} in ('created', 'in_progress'))::int`,
      })
      .from(sessions)
      .where(eq(sessions.participantUserId, normalizedUserId))
      .then((rows) => rows[0]),
    database
      .select({
        id: sessions.id,
        practiceId: sessions.practiceId,
        practiceVersionId: sessions.practiceVersionId,
        title: practiceVersions.title,
        status: sessions.status,
        currentQuestionOrder: sessions.currentQuestionPosition,
        startedAt: sessions.startedAt,
        completedAt: sessions.completedAt,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .innerJoin(
        practiceVersions,
        eq(practiceVersions.id, sessions.practiceVersionId),
      )
      .where(eq(sessions.participantUserId, normalizedUserId))
      .orderBy(desc(sessions.createdAt))
      .limit(5),
    database === db
      ? getCandidateScoredSessions(normalizedUserId)
      : loadCandidateScoredSessions(normalizedUserId, database),
  ]);

  const scoreBySessionId = new Map(
    scoredSessions.map((session) => [session.sessionId, session.overallScore]),
  );
  const scores = scoredSessions.map((session) => session.overallScore);

  const recentSessions: CandidateSessionHistoryItem[] = recentRows.map((row) => {
    const overallScore = scoreBySessionId.get(row.id) ?? null;

    return {
      id: row.id,
      practiceId: row.practiceId,
      practiceVersionId: row.practiceVersionId,
      title: row.title,
      status: sessionStatusSchema.parse(row.status),
      currentQuestionOrder: row.currentQuestionOrder,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      overallScore,
      hasReport: overallScore != null,
    };
  });

  return {
    summary: {
      totalSessions: Number(countRow?.total ?? 0),
      completedSessions: Number(countRow?.completed ?? 0),
      inProgressSessions: Number(countRow?.inProgress ?? 0),
      scoredSessions: scores.length,
      averageScore:
        scores.length === 0
          ? null
          : roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      bestScore: scores.length === 0 ? null : Math.max(...scores),
      latestScore: scoredSessions[0]?.overallScore ?? null,
    },
    recentSessions,
  };
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
