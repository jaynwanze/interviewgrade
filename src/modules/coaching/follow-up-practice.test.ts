import { describe, expect, it } from 'vitest';

import type { CoachGroundingContext } from './coach.service';
import { buildFollowUpPracticeBrief } from './follow-up-practice';

function grounding(): CoachGroundingContext {
  return {
    sessionId: 'session-1',
    practiceTitle: 'Stakeholder interview Practice',
    scenario: 'Interview for a cross-functional role.',
    sessionEvaluation: {
      id: 'evaluation-1',
      sessionId: 'session-1',
      overallScore: 58,
      criterionScores: [
        {
          criterionId: 'clarity',
          criterionName: 'Clarity',
          score: 68,
          feedback: 'Generally understandable.',
        },
        {
          criterionId: 'specificity',
          criterionName: 'Specificity',
          score: 42,
          feedback: 'Needs more concrete detail.',
        },
        {
          criterionId: 'judgement',
          criterionName: 'Judgement',
          score: 51,
          feedback: 'Explain trade-offs more clearly.',
        },
      ],
      summary: 'The response needs more concrete examples and clearer trade-offs.',
      strengths: ['Clear overall structure.'],
      improvements: [
        'Use specific examples.',
        'Explain trade-offs and outcomes.',
      ],
      recommendation: 'Practise concise STAR answers with measurable outcomes.',
      schemaVersion: 'practice-session-v1',
      modelMetadata: {
        provider: 'openai',
        model: 'test-model',
        promptVersion: 'test-v1',
      },
      createdAt: new Date('2026-08-25T00:00:00Z'),
    },
  };
}

describe('buildFollowUpPracticeBrief', () => {
  it('uses persisted report weaknesses and recommendations to create a fresh-Practice brief', () => {
    const brief = buildFollowUpPracticeBrief(grounding());

    expect(brief).toContain('Stakeholder interview Practice');
    expect(brief).toContain('Specificity: 42/100');
    expect(brief).toContain('Judgement: 51/100');
    expect(brief).toContain('Use specific examples.');
    expect(brief).toContain('Practise concise STAR answers');
    expect(brief).toContain('Do not copy the previous questions verbatim');
    expect(brief).toContain('Do not invent personal experience');
  });

  it('does not include a raw response transcript', () => {
    const brief = buildFollowUpPracticeBrief(grounding());

    expect(brief).not.toContain('transcript');
    expect(brief).not.toContain('SOURCE RESPONSE');
  });

  it('requires a persisted session evaluation', () => {
    const context = grounding();
    delete context.sessionEvaluation;

    expect(() => buildFollowUpPracticeBrief(context)).toThrow(
      'completed session evaluation',
    );
  });
});
