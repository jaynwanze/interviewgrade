import { describe, expect, it } from 'vitest';

import { buildCreatorPracticeAnalytics } from './creator-practice-analytics';

describe('buildCreatorPracticeAnalytics', () => {
  it('calculates completion, score distribution, median, and criterion averages', () => {
    const analytics = buildCreatorPracticeAnalytics([
      {
        status: 'completed',
        overallScore: 20,
        criterionScores: [
          { criterionName: 'Correctness', score: 20 },
          { criterionName: 'Communication', score: 80 },
        ],
      },
      {
        status: 'completed',
        overallScore: 40,
        criterionScores: [{ criterionName: 'Correctness', score: 60 }],
      },
      {
        status: 'completed',
        overallScore: 80,
        criterionScores: [{ criterionName: 'Communication', score: 100 }],
      },
      {
        status: 'in_progress',
        overallScore: null,
        criterionScores: null,
      },
    ]);

    expect(analytics.totalAttempts).toBe(4);
    expect(analytics.completedAttempts).toBe(3);
    expect(analytics.completionRate).toBe(75);
    expect(analytics.evaluatedAttempts).toBe(3);
    expect(analytics.averageScore).toBeCloseTo(46.67, 1);
    expect(analytics.medianScore).toBe(40);
    expect(analytics.scoreDistribution.map((bucket) => bucket.count)).toEqual([
      1,
      1,
      0,
      1,
    ]);
    expect(analytics.criterionAverages).toEqual([
      {
        criterionName: 'Correctness',
        averageScore: 40,
        evaluatedAttempts: 2,
      },
      {
        criterionName: 'Communication',
        averageScore: 90,
        evaluatedAttempts: 2,
      },
    ]);
  });

  it('ignores malformed criterion evidence and returns empty score metrics safely', () => {
    const analytics = buildCreatorPracticeAnalytics([
      {
        status: 'created',
        overallScore: null,
        criterionScores: [{ criterionName: '', score: 'bad' }],
      },
    ]);

    expect(analytics.completionRate).toBe(0);
    expect(analytics.evaluatedAttempts).toBe(0);
    expect(analytics.averageScore).toBeNull();
    expect(analytics.medianScore).toBeNull();
    expect(analytics.criterionAverages).toEqual([]);
    expect(analytics.scoreDistribution.every((bucket) => bucket.count === 0)).toBe(
      true,
    );
  });
});
