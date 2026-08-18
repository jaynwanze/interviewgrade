import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { sessionEvaluations } from '@/db/schema/evaluations';
import { practiceVersions } from '@/db/schema/practices';
import { sessions } from '@/db/schema/sessions';
import { criterionScoreSchema } from '@/modules/evaluation/evaluation.schema';

const criterionScoresSchema = criterionScoreSchema.array();
const MAX_TREND_SESSIONS = 12;

export type CandidateScoreTrendPoint = {
  sessionId: string;
  practiceId: string;
  title: string;
  score: number;
  completedAt: string;
};

export type CandidateCriterionPerformance = {
  name: string;
  averageScore: number;
  latestScore: number;
  previousScore: number | null;
  change: number | null;
  evidenceCount: number;
};

export type CandidatePracticePerformance = {
  practiceId: string;
  title: string;
  scoredAttempts: number;
  averageScore: number;
  bestScore: number;
  latestScore: number;
  latestSessionId: string;
  latestCompletedAt: string;
};

export type CandidatePracticeAnalytics = {
  scoredSessions: number;
  scoreTrend: CandidateScoreTrendPoint[];
  scoreChange: number | null;
  criterionPerformance: CandidateCriterionPerformance[];
  strongestCriterion: CandidateCriterionPerformance | null;
  focusCriterion: CandidateCriterionPerformance | null;
  practicePerformance: CandidatePracticePerformance[];
  latestRecommendation: string | null;
};

type ScoredSession = {
  sessionId: string;
  practiceId: string;
  title: string;
  completedAt: Date;
  overallScore: number;
  criterionScores: ReturnType<typeof criterionScoresSchema.parse>;
  recommendation: string;
};

/**
 * Candidate analytics derived exclusively from persisted v2 session reports.
 *
 * Session evaluations are schema-versioned and append-only. For dashboard
 * analytics we intentionally use the newest persisted evaluation per session,
 * while older versions remain available to the report layer for reproducibility.
 */
export async function getCandidatePracticeAnalytics(
  userId: string,
  database: InterviewGradeDatabase = db,
): Promise<CandidatePracticeAnalytics> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('A candidate user id is required to load practice analytics.');
  }

  const completedSessions = await database
    .select({
      sessionId: sessions.id,
      practiceId: sessions.practiceId,
      title: practiceVersions.title,
      completedAt: sessions.completedAt,
    })
    .from(sessions)
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
    .orderBy(desc(sessions.completedAt));

  const sessionIds = completedSessions.map((session) => session.sessionId);
  if (sessionIds.length === 0) {
    return emptyAnalytics();
  }

  const evaluationRows = await database
    .select({
      sessionId: sessionEvaluations.sessionId,
      overallScore: sessionEvaluations.overallScore,
      criterionScores: sessionEvaluations.criterionScores,
      recommendation: sessionEvaluations.recommendation,
      createdAt: sessionEvaluations.createdAt,
    })
    .from(sessionEvaluations)
    .where(inArray(sessionEvaluations.sessionId, sessionIds))
    .orderBy(desc(sessionEvaluations.createdAt));

  const latestEvaluationBySession = new Map<
    string,
    (typeof evaluationRows)[number]
  >();

  for (const evaluation of evaluationRows) {
    if (!latestEvaluationBySession.has(evaluation.sessionId)) {
      latestEvaluationBySession.set(evaluation.sessionId, evaluation);
    }
  }

  const scoredSessions: ScoredSession[] = [];

  for (const session of completedSessions) {
    const evaluation = latestEvaluationBySession.get(session.sessionId);
    if (!evaluation || !session.completedAt) {
      continue;
    }

    const parsedCriteria = criterionScoresSchema.safeParse(
      evaluation.criterionScores,
    );

    scoredSessions.push({
      sessionId: session.sessionId,
      practiceId: session.practiceId,
      title: session.title,
      completedAt: session.completedAt,
      overallScore: Number(evaluation.overallScore),
      criterionScores: parsedCriteria.success ? parsedCriteria.data : [],
      recommendation: evaluation.recommendation,
    });
  }

  if (scoredSessions.length === 0) {
    return emptyAnalytics();
  }

  const recentTrendSessions = scoredSessions.slice(0, MAX_TREND_SESSIONS);
  const scoreTrend = recentTrendSessions
    .slice()
    .reverse()
    .map((session) => ({
      sessionId: session.sessionId,
      practiceId: session.practiceId,
      title: session.title,
      score: roundScore(session.overallScore),
      completedAt: session.completedAt.toISOString(),
    }));

  const scoreChange =
    scoredSessions.length >= 2
      ? roundScore(
          scoredSessions[0].overallScore - scoredSessions[1].overallScore,
        )
      : null;

  const criterionPerformance = buildCriterionPerformance(scoredSessions);
  const practicePerformance = buildPracticePerformance(scoredSessions);

  return {
    scoredSessions: scoredSessions.length,
    scoreTrend,
    scoreChange,
    criterionPerformance,
    strongestCriterion: criterionPerformance[0] ?? null,
    focusCriterion:
      criterionPerformance.length > 0
        ? criterionPerformance[criterionPerformance.length - 1]
        : null,
    practicePerformance,
    latestRecommendation: scoredSessions[0].recommendation || null,
  };
}

function buildCriterionPerformance(
  scoredSessions: ScoredSession[],
): CandidateCriterionPerformance[] {
  const aggregate = new Map<
    string,
    { name: string; scores: number[]; total: number }
  >();

  // scoredSessions are newest first. Preserve that order in each criterion's
  // score list so latest/previous comparisons remain deterministic.
  for (const session of scoredSessions) {
    for (const criterion of session.criterionScores) {
      const key = normalizeCriterionName(criterion.criterionName);
      if (!key) {
        continue;
      }

      const existing = aggregate.get(key);
      if (existing) {
        existing.scores.push(criterion.score);
        existing.total += criterion.score;
      } else {
        aggregate.set(key, {
          name: criterion.criterionName.trim(),
          scores: [criterion.score],
          total: criterion.score,
        });
      }
    }
  }

  return Array.from(aggregate.values())
    .map((criterion) => {
      const latestScore = criterion.scores[0];
      const previousScore = criterion.scores[1] ?? null;

      return {
        name: criterion.name,
        averageScore: roundScore(criterion.total / criterion.scores.length),
        latestScore: roundScore(latestScore),
        previousScore:
          previousScore == null ? null : roundScore(previousScore),
        change:
          previousScore == null
            ? null
            : roundScore(latestScore - previousScore),
        evidenceCount: criterion.scores.length,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore || a.name.localeCompare(b.name));
}

function buildPracticePerformance(
  scoredSessions: ScoredSession[],
): CandidatePracticePerformance[] {
  const aggregate = new Map<
    string,
    {
      title: string;
      scores: number[];
      total: number;
      latestSessionId: string;
      latestCompletedAt: Date;
    }
  >();

  for (const session of scoredSessions) {
    const existing = aggregate.get(session.practiceId);
    if (existing) {
      existing.scores.push(session.overallScore);
      existing.total += session.overallScore;
    } else {
      aggregate.set(session.practiceId, {
        title: session.title,
        scores: [session.overallScore],
        total: session.overallScore,
        latestSessionId: session.sessionId,
        latestCompletedAt: session.completedAt,
      });
    }
  }

  return Array.from(aggregate.entries())
    .map(([practiceId, practice]) => ({
      practiceId,
      title: practice.title,
      scoredAttempts: practice.scores.length,
      averageScore: roundScore(practice.total / practice.scores.length),
      bestScore: roundScore(Math.max(...practice.scores)),
      latestScore: roundScore(practice.scores[0]),
      latestSessionId: practice.latestSessionId,
      latestCompletedAt: practice.latestCompletedAt.toISOString(),
    }))
    .sort(
      (a, b) =>
        new Date(b.latestCompletedAt).getTime() -
        new Date(a.latestCompletedAt).getTime(),
    );
}

function normalizeCriterionName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function emptyAnalytics(): CandidatePracticeAnalytics {
  return {
    scoredSessions: 0,
    scoreTrend: [],
    scoreChange: null,
    criterionPerformance: [],
    strongestCriterion: null,
    focusCriterion: null,
    practicePerformance: [],
    latestRecommendation: null,
  };
}
