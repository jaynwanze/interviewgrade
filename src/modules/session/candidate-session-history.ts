import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { sessionEvaluations } from '@/db/schema/evaluations';
import { practiceVersions } from '@/db/schema/practices';
import { sessions } from '@/db/schema/sessions';
import {
  sessionStatusSchema,
  type SessionStatus,
} from '@/modules/session/session.schema';

export type CandidateSessionHistoryItem = {
  id: string;
  practiceId: string;
  practiceVersionId: string;
  title: string;
  status: SessionStatus;
  currentQuestionOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  overallScore: number | null;
  hasReport: boolean;
};

export type CandidateSessionHistorySummary = {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  scoredSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
};

/**
 * Candidate-owned v2 session history.
 *
 * Ownership is intentionally based only on participant_user_id. Anonymous
 * public sessions are not claimed later by matching an unverified email field.
 */
export async function listCandidateSessionHistory(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<CandidateSessionHistoryItem[]> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('A candidate user id is required to load session history.');
  }

  const rows = await database
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
    .orderBy(desc(sessions.createdAt));

  const sessionIds = rows.map((row) => row.id);
  const evaluations =
    sessionIds.length === 0
      ? []
      : await database
          .select({
            sessionId: sessionEvaluations.sessionId,
            overallScore: sessionEvaluations.overallScore,
            createdAt: sessionEvaluations.createdAt,
          })
          .from(sessionEvaluations)
          .where(inArray(sessionEvaluations.sessionId, sessionIds))
          .orderBy(desc(sessionEvaluations.createdAt));

  // Evaluation schema versions are append-only. The newest persisted session
  // evaluation is the dashboard/history score while older versions remain
  // available to the report/evaluation layer for reproducibility.
  const latestEvaluationBySession = new Map<string, number>();
  for (const evaluation of evaluations) {
    if (!latestEvaluationBySession.has(evaluation.sessionId)) {
      latestEvaluationBySession.set(
        evaluation.sessionId,
        Number(evaluation.overallScore),
      );
    }
  }

  return rows.map((row) => {
    const overallScore = latestEvaluationBySession.get(row.id) ?? null;

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
}

export function summarizeCandidateSessionHistory(
  history: CandidateSessionHistoryItem[],
): CandidateSessionHistorySummary {
  const completed = history.filter((session) => session.status === 'completed');
  const scored = completed.filter((session) => session.overallScore != null);
  const scores = scored.map((session) => session.overallScore!);

  return {
    totalSessions: history.length,
    completedSessions: completed.length,
    inProgressSessions: history.filter(
      (session) => session.status === 'created' || session.status === 'in_progress',
    ).length,
    scoredSessions: scored.length,
    averageScore:
      scores.length === 0
        ? null
        : roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    bestScore: scores.length === 0 ? null : Math.max(...scores),
    latestScore: scored[0]?.overallScore ?? null,
  };
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
