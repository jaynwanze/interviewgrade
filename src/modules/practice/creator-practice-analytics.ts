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

export type CreatorPracticeAnalyticsInput = {
  status: string;
  overallScore: number | null;
  criterionScores: unknown;
};

type CreatorCriterionScore = {
  criterionName: string;
  score: number;
};

export function buildCreatorPracticeAnalytics(
  rows: CreatorPracticeAnalyticsInput[],
): CreatorPracticeAnalytics {
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
      // Criterion ids may change when a new immutable Practice version is
      // published. Aggregate by normalized display name so the creator sees a
      // continuous skill signal across versions when the criterion is unchanged.
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
    const criterionName = record.criterionName;
    const rawScore = record.score;
    const score = typeof rawScore === 'number' ? rawScore : Number(rawScore);

    if (
      typeof criterionName !== 'string' ||
      !criterionName.trim() ||
      !Number.isFinite(score)
    ) {
      return [];
    }

    return [{ criterionName, score }];
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
