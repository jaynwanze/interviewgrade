import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { sessionEvaluations } from '@/db/schema/evaluations';
import { practices, practiceVersions } from '@/db/schema/practices';
import { sessions } from '@/db/schema/sessions';
import { SESSION_EVALUATION_SCHEMA_VERSION } from '@/modules/evaluation/evaluation.service';
import type { SessionStatus } from '@/modules/session/session.schema';

type CreatorCriterionScore = {
  criterionId: string;
  criterionName: string;
  score: number;
};

export type CreatorPracticeResultAttempt = {
  sessionId: string;
  practiceVersion: number;
  participantUserId: string | null;
  participantName: string | null;
  participantEmail: string | null;
  status: SessionStatus;
  currentQuestionOrder: number;
  overallScore: number | null;
  hasReport: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type CreatorCriterionAggregate = {
  criterionName: string;
  averageScore: number;
  evaluatedAttempts: number;
};

export type CreatorScoreDistributionBucket = {
  key: 'needs-significant-development' | 'needs-development' | 'developing-well' | 'strong';
  label: string;
  rangeLabel: string;
  count: number;
};

export type CreatorPracticeAnalytics = {
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number | null;
  evaluatedAttempts: number;
  averageScore: number | null;
  medianScore: number | null;
  scoreDistribution: CreatorScoreDistributionBucket[];
  criterionAverages: CreatorCriterionAggregate[];
};

export type CreatorPracticeResults = {
  practice: {
    id: string;
    title: string;
    status: string;
    shareSlug: string | null;
  };
  attempts: CreatorPracticeResultAttempt[];
  analytics: CreatorPracticeAnalytics;
};

type ResultRow = {
  sessionId: string;
  practiceVersion: number;
  participantUserId: string | null;
  participantName: string | null;
  participantEmail: string | null;
  status: string;
  currentQuestionOrder: number;
  overallScore: string | null;
  criterionScores: unknown;
  reportId: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export async function getCreatorPracticeResults(
  practiceId: string,
  creatorUserId: string,
  database: InterviewGradeDatabase = db,
): Promise<CreatorPracticeResults | null> {
  const [practice] = await database
    .select({
      id: practices.id,
      title: practices.title,
      status: practices.status,
      shareSlug: practices.shareSlug,
    })
    .from(practices)
    .where(
      and(eq(practices.id, practiceId), eq(practices.createdBy, creatorUserId)),
    )
    .limit(1);

  if (!practice) {
    return null;
  }

  const rows = await database
    .select({
      sessionId: sessions.id,
      practiceVersion: practiceVersions.version,
      participantUserId: sessions.participantUserId,
      participantName: sessions.participantName,
      participantEmail: sessions.participantEmail,
      status: sessions.status,
      currentQuestionOrder: sessions.currentQuestionPosition,
      overallScore: sessionEvaluations.overallScore,
      criterionScores: sessionEvaluations.criterionScores,
      reportId: sessionEvaluations.id,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(
      practiceVersions,
      eq(sessions.practiceVersionId, practiceVersions.id),
    )
    .leftJoin(
      sessionEvaluations,
      and(
        eq(sessionEvaluations.sessionId, sessions.id),
        eq(
          sessionEvaluations.schemaVersion,
          SESSION_EVALUATION_SCHEMA_VERSION,
        ),
      ),
    )
    .where(eq(sessions.practiceId, practiceId))
    .orderBy(desc(sessions.createdAt));

  const resultRows = rows as ResultRow[];
  const attempts = resultRows.map((row) => ({
    sessionId: row.sessionId,
    practiceVersion: row.practiceVersion,
    participantUserId: row.participantUserId,
    participantName: row.participantName,
    participantEmail: row.participantEmail,
    status: row.status as SessionStatus,
    currentQuestionOrder: row.currentQuestionOrder,
    overallScore: row.overallScore == null ? null : Number(row.overallScore),
    hasReport: row.reportId != null,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
  }));

  return {
    practice,
    attempts,
    analytics: buildCreatorPracticeAnalytics(resultRows),
  };
}

function buildCreatorPracticeAnalytics(rows: ResultRow[]): CreatorPracticeAnalytics {
  const completedAttempts = rows.filter((row) => row.status === 'completed').length;
  const scoredRows = rows.filter((row) => row.overallScore != null);
  const scores = scoredRows
    .map((row) => Number(row.overallScore))
    .filter((score) => Number.isFinite(score));

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;
  const medianScore = calculateMedian(scores);

  const criterionAccumulator = new Map<
    string,
    { criterionName: string; scoreTotal: number; attempts: number }
  >();

  for (const row of scoredRows) {
    for (const criterion of parseCriterionScores(row.criterionScores)) {
      const key = criterion.criterionName.trim().toLocaleLowerCase();
      const existing = criterionAccumulator.get(key);

      if (existing) {
        existing.scoreTotal += criterion.score;
        existing.attempts += 1;
      } else {
        criterionAccumulator.set(key, {
          criterionName: criterion.criterionName,
          scoreTotal: criterion.score,
          attempts: 1,
        });
      }
    }
  }

  const criterionAverages = Array.from(criterionAccumulator.values())
    .map((criterion) => ({
      criterionName: criterion.criterionName,
      averageScore: criterion.scoreTotal / criterion.attempts,
      evaluatedAttempts: criterion.attempts,
    }))
    .sort((a, b) => a.averageScore - b.averageScore);

  return {
    totalAttempts: rows.length,
    completedAttempts,
    completionRate:
      rows.length > 0 ? (completedAttempts / rows.length) * 100 : null,
    evaluatedAttempts: scores.length,
    averageScore,
    medianScore,
    scoreDistribution: buildScoreDistribution(scores),
    criterionAverages,
  };
}

function parseCriterionScores(value: unknown): CreatorCriterionScore[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const criterionId = record.criterionId;
    const criterionName = record.criterionName;
    const rawScore = record.score;
    const score = typeof rawScore === 'number' ? rawScore : Number(rawScore);

    if (
      typeof criterionId !== 'string' ||
      typeof criterionName !== 'string' ||
      !criterionName.trim() ||
      !Number.isFinite(score)
    ) {
      return [];
    }

    return [{ criterionId, criterionName, score }];
  });
}

function calculateMedian(scores: number[]): number | null {
  if (scores.length === 0) return null;

  const sorted = [...scores].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null;
  }

  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  return lower == null || upper == null ? null : (lower + upper) / 2;
}

function buildScoreDistribution(scores: number[]): CreatorScoreDistributionBucket[] {
  const buckets: CreatorScoreDistributionBucket[] = [
    {
      key: 'needs-significant-development',
      label: 'Needs significant development',
      rangeLabel: '0–39',
      count: 0,
    },
    {
      key: 'needs-development',
      label: 'Needs development',
      rangeLabel: '40–59',
      count: 0,
    },
    {
      key: 'developing-well',
      label: 'Developing well',
      rangeLabel: '60–79',
      count: 0,
    },
    {
      key: 'strong',
      label: 'Strong',
      rangeLabel: '80–100',
      count: 0,
    },
  ];

  for (const score of scores) {
    if (score >= 80) {
      buckets[3]!.count += 1;
    } else if (score >= 60) {
      buckets[2]!.count += 1;
    } else if (score >= 40) {
      buckets[1]!.count += 1;
    } else {
      buckets[0]!.count += 1;
    }
  }

  return buckets;
}

export async function creatorOwnsPracticeSession(
  practiceId: string,
  sessionId: string,
  creatorUserId: string,
  database: InterviewGradeDatabase = db,
): Promise<boolean> {
  const [row] = await database
    .select({ sessionId: sessions.id })
    .from(sessions)
    .innerJoin(practices, eq(sessions.practiceId, practices.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.practiceId, practiceId),
        eq(practices.createdBy, creatorUserId),
      ),
    )
    .limit(1);

  return Boolean(row);
}
