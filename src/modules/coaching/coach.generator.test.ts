import { describe, expect, it } from 'vitest';

import { buildCoachPrompt } from './coach.generator';
import type { CoachGroundingContext } from './coach.service';

describe('buildCoachPrompt', () => {
  it('grounds a response-level question in the saved response and persisted evaluation', () => {
    const grounding: CoachGroundingContext = {
      sessionId: 'session-1',
      practiceTitle: 'Stakeholder Practice',
      scenario: 'You are handling a difficult delivery conversation.',
      response: {
        response: {
          id: 'response-1',
          sessionId: 'session-1',
          questionId: 'question-1',
          questionOrder: 0,
          transcript: 'I met the stakeholder, clarified the risk, and agreed a revised plan.',
          attemptNumber: 1,
          submittedAt: new Date('2026-08-25T12:00:00Z'),
        },
        question: {
          id: 'question-1',
          order: 0,
          prompt: 'Tell me about a difficult stakeholder conversation.',
          guidance: null,
          preparationSeconds: 30,
          responseSeconds: 120,
          rubricCriterionIds: ['criterion-1'],
        },
        rubricCriteria: [
          {
            id: 'criterion-1',
            order: 0,
            name: 'Stakeholder communication',
            description: 'Communicates clearly and manages trade-offs.',
            weight: 100,
          },
        ],
        evaluation: {
          id: 'evaluation-1',
          sessionResponseId: 'response-1',
          overallScore: 72,
          criterionScores: [
            {
              criterionId: 'criterion-1',
              criterionName: 'Stakeholder communication',
              score: 72,
              feedback: 'Clear structure, but make the outcome more specific.',
            },
          ],
          summary: 'A clear answer with an underdeveloped outcome.',
          strengths: ['Clear situation and action.'],
          improvements: ['Make the result concrete.'],
          recommendation: 'Use a measurable result next time.',
          schemaVersion: 'response-rubric-v1',
          modelMetadata: {
            provider: 'openai',
            model: 'test',
            promptVersion: 'test',
          },
          createdAt: new Date('2026-08-25T12:01:00Z'),
        },
      },
    };

    const prompt = buildCoachPrompt('How can I improve this answer?', grounding);

    expect(prompt).toContain('How can I improve this answer?');
    expect(prompt).toContain(grounding.response!.response.transcript);
    expect(prompt).toContain('A clear answer with an underdeveloped outcome.');
    expect(prompt).toContain('Stakeholder communication');
    expect(prompt).not.toContain('participantEmail');
    expect(prompt).not.toContain('participantName');
  });
});
