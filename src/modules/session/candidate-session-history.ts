import 'server-only';

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

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

export type CandidateSessionHistoryFilter =
  | 'all'
  | 'completed'
  | 'not_completed'
  | 'not_started';

export type CandidateSessionHistoryCounts = {
  all: number;
  completed: number;
  notCompleted: number;
  notStarted: number;
};

export type CandidateSessionHistoryPage = {
  items: CandidateSessionHistoryItem[];
  counts: CandidateSessionHistoryCounts;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Full candidate-owned v2 history retained for compatibility with callers that
 * genuinely need the complete set. Dashboard/history surfaces should prefer the
 * paged/summary APIs below so row volume does not grow with account age.
 */
export async function listCandidateSessionHistory(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<CandidateSessionHistoryItem[]> {
  const normalizedUserId = normalizeUserId(userId);
  const rows = await loadSessionRows(normalizedUserId, database);
  return attachLatestScores(rows, database);
}

/** Fetch one candidate-owned history page plus constant-size status counts. */
export async function getCandidateSessionHistoryPage(
  userId: string,
  options: {
    filter?: CandidateSessionHistoryFilter;
    page?: number;
    pageSize?: number;
  } = {},
  database: InterviewGradeDatabase = db,
): Promise<CandidateSessionHistoryPage> {
  const normalizedUserId = normalizeUserId(userId);
  const filter = options.filter ?? 'all';
  const pageSize = clampPageSize(options.pageSize ?? 5);
  const requestedPage = Math.max(1, Math.trunc(options.page ?? 1));

  const [countRow] = await database
    .select({
      all: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${sessions.status} = 'completed')::int`,
      notCompleted: sql<number>`count(*) filter (where ${sessions.status} in ('in_progress', 'abandoned'))::int`,
      notStarted: sql<number>`count(*) filter (where ${sessions.status} = 'created')::int`,
    })
    .from(sessions)
    .where(eq(sessions.participantUserId, normalizedUserId));

  const counts: CandidateSessionHistoryCounts = {
    all: Number(countRow?.all ?? 0),
    completed: Number(countRow?.completed ?? 0),
    notCompleted: Number(countRow?.notCompleted ?? 0),
    notStarted: Number(countRow?.notStarted ?? 0),
  };
  const totalItems = countForFilter(counts, filter);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const statusCondition = statusConditionForFilter(filter);

  // History only renders a handful of rows. Pull the latest score with each row
  // so the normal page load does not need a third database round trip after the
  // count + page query.
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
      overallScore: sql<number | null>`(
        select ${sessionEvaluations.overallScore}
        from ${sessionEvaluations}
        where ${sessionEvaluations.sessionId} = ${sessions.id}
        order by ${sessionEvaluations.createdAt} desc
        limit 1
      )`,
    })
    .from(sessions)
    .innerJoin(
      practiceVersions,
      eq(practiceVersions.id, sessions.practiceVersionId),
    )
    .where(
      statusCondition
        ? and(eq(sessions.participantUserId, normalizedUserId), statusCondition)
        : eq(sessions.participantUserId, normalizedUserId),
    )
    .orderBy(desc(sessions.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map((row) => {
      const overallScore =
        row.overallScore == null ? null : Number(row.overallScore);
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
    }),
    counts,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

/**
 * Lightweight dashboard progress read: aggregate status counts, fetch only the
 * five recent sessions, and read numeric evaluation scores without materializing
 * the candidate's complete history objects.
 */
export async function getCandidateSessionProgress(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<{
  summary: CandidateSessionHistorySummary;
  recentSessions: CandidateSessionHistoryItem[];
}> {
  const normalizedUserId = normalizeUserId(userId);

  const [countRow, recentRows, scoreRows] = await Promise.all([
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
    database
      .select({
        sessionId: sessionEvaluations.sessionId,
        overallScore: sessionEvaluations.overallScore,
        createdAt: sessionEvaluations.createdAt,
      })
      .from(sessionEvaluations)
      .innerJoin(sessions, eq(sessions.id, sessionEvaluations.sessionId))
      .where(
        and(
          eq(sessions.participantUserId, normalizedUserId),
          eq(sessions.status, 'completed'),
        ),
      )
      .orderBy(desc(sessionEvaluations.createdAt)),
  ]);

  const latestScoreBySession = new Map<string, number>();
  for (const row of scoreRows) {
    if (!latestScoreBySession.has(row.sessionId)) {
      latestScoreBySession.set(row.sessionId, Number(row.overallScore));
    }
  }
  const scores = Array.from(latestScoreBySession.values());
  const recentSessions = await attachLatestScores(recentRows, database);

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
      latestScore: scores[0] ?? null,
    },
    recentSessions,
  };
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

function normalizeUserId(userId: string) {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('A candidate user id is required to load session history.');
  }
  return normalizedUserId;
}

function loadSessionRows(
  userId: string,
  database: InterviewGradeDatabase,
) {
  return database
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
    .where(eq(sessions.participantUserId, userId))
    .orderBy(desc(sessions.createdAt));
}

type SessionRow = Awaited<ReturnType<typeof loadSessionRows>>[number];

async function attachLatestScores(
  rows: SessionRow[],
  database: InterviewGradeDatabase,
): Promise<CandidateSessionHistoryItem[]> {
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

function statusConditionForFilter(filter: CandidateSessionHistoryFilter) {
  switch (filter) {
    case 'completed':
      return eq(sessions.status, 'completed');
    case 'not_completed':
      return or(eq(sessions.status, 'in_progress'), eq(sessions.status, 'abandoned'));
    case 'not_started':
      return eq(sessions.status, 'created');
    case 'all':
    default:
      return undefined;
  }
}

function countForFilter(
  counts: CandidateSessionHistoryCounts,
  filter: CandidateSessionHistoryFilter,
) {
  switch (filter) {
    case 'completed':
      return counts.completed;
    case 'not_completed':
      return counts.notCompleted;
    case 'not_started':
      return counts.notStarted;
    case 'all':
    default:
      return counts.all;
  }
}

function clampPageSize(pageSize: number) {
  return Math.min(25, Math.max(1, Math.trunc(pageSize)));
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
