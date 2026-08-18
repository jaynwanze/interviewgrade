import 'server-only';

import { z } from 'zod';

import type {
  PracticeQuestion,
  RubricCriterion,
} from '@/modules/practice/practice.schema';
import type { SessionResponse } from '@/modules/session/session.schema';
import { createOpenAIClient } from '@/utils/openai/config';
import type { CriterionScore } from './evaluation.schema';

export const RESPONSE_EVALUATION_MODEL = 'gpt-5-mini';
export const RESPONSE_PROMPT_VERSION = 'practice-response-v1';

const generatedEvaluationSchema = z.object({
  criterionScores: z.array(
    z.object({
      criterionId: z.string().min(1),
      score: z.number().min(0).max(100),
      feedback: z.string().min(1),
    }),
  ),
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1).max(4),
  improvements: z.array(z.string().min(1)).min(1).max(4),
  recommendation: z.string().min(1),
});

type GeneratedEvaluation = z.infer<typeof generatedEvaluationSchema>;

export type GeneratedResponseEvaluation = {
  overallScore: number;
  criterionScores: CriterionScore[];
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendation: string;
};

export async function generateResponseEvaluation(input: {
  practiceTitle: string;
  scenario: string;
  question: PracticeQuestion;
  response: SessionResponse;
  rubricCriteria: RubricCriterion[];
}): Promise<GeneratedResponseEvaluation> {
  if (input.rubricCriteria.length === 0) {
    throw new Error('A published rubric is required to evaluate a response.');
  }

  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model: RESPONSE_EVALUATION_MODEL,
    instructions:
      "You are InterviewGrade's scoring engine. Evaluate only evidence present in the candidate answer, in the context of the question and scenario. Score every supplied rubric criterion from 0 to 100. Be rigorous, constructive, and concise. Do not invent achievements, facts, or missing details. Do not add criteria. Return only the requested structured output.",
    input: buildEvaluationPrompt(input),
    max_output_tokens: 1200,
    text: {
      format: {
        type: 'json_schema',
        name: 'interviewgrade_response_evaluation',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            criterionScores: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  criterionId: { type: 'string' },
                  score: { type: 'number', minimum: 0, maximum: 100 },
                  feedback: { type: 'string' },
                },
                required: ['criterionId', 'score', 'feedback'],
              },
            },
            summary: { type: 'string' },
            strengths: {
              type: 'array',
              items: { type: 'string' },
            },
            improvements: {
              type: 'array',
              items: { type: 'string' },
            },
            recommendation: { type: 'string' },
          },
          required: [
            'criterionScores',
            'summary',
            'strengths',
            'improvements',
            'recommendation',
          ],
        },
      },
    },
  });

  if (!response.output_text) {
    throw new Error('The evaluation model returned no structured output.');
  }

  const generated = generatedEvaluationSchema.parse(
    JSON.parse(response.output_text) as unknown,
  );
  const criterionScores = validateCriterionCoverage(
    generated,
    input.rubricCriteria,
  );

  return {
    overallScore: calculateWeightedScore(criterionScores, input.rubricCriteria),
    criterionScores,
    summary: generated.summary,
    strengths: generated.strengths,
    improvements: generated.improvements,
    recommendation: generated.recommendation,
  };
}

function buildEvaluationPrompt(input: {
  practiceTitle: string;
  scenario: string;
  question: PracticeQuestion;
  response: SessionResponse;
  rubricCriteria: RubricCriterion[];
}): string {
  const rubric = input.rubricCriteria
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(
      (criterion) =>
        `- id=${criterion.id}; name=${criterion.name}; weight=${criterion.weight}%; description=${criterion.description}`,
    )
    .join('\n');

  return `Practice: ${input.practiceTitle}\n\nScenario:\n${input.scenario}\n\nQuestion:\n${input.question.prompt}\n\nQuestion guidance:\n${input.question.guidance ?? 'None'}\n\nCandidate answer:\n${input.response.transcript}\n\nPublished rubric:\n${rubric}\n\nReturn exactly one criterionScores item for each rubric id above. The criterionId value must exactly match the supplied id.`;
}

function validateCriterionCoverage(
  generated: GeneratedEvaluation,
  rubricCriteria: RubricCriterion[],
): CriterionScore[] {
  const rubricById = new Map(
    rubricCriteria.map((criterion) => [criterion.id, criterion] as const),
  );
  const seen = new Set<string>();

  const scores = generated.criterionScores.map((score) => {
    if (seen.has(score.criterionId)) {
      throw new Error(`Duplicate evaluation criterion ${score.criterionId}.`);
    }
    seen.add(score.criterionId);

    const criterion = rubricById.get(score.criterionId);
    if (!criterion) {
      throw new Error(`Unknown evaluation criterion ${score.criterionId}.`);
    }

    return {
      criterionId: criterion.id!,
      criterionName: criterion.name,
      score: score.score,
      feedback: score.feedback,
    };
  });

  if (scores.length !== rubricCriteria.length) {
    throw new Error('The evaluation did not score every published rubric criterion.');
  }

  for (const criterion of rubricCriteria) {
    if (!criterion.id || !seen.has(criterion.id)) {
      throw new Error(`The evaluation omitted rubric criterion ${criterion.name}.`);
    }
  }

  return scores.sort((a, b) => {
    const aOrder = rubricById.get(a.criterionId)?.order ?? 0;
    const bOrder = rubricById.get(b.criterionId)?.order ?? 0;
    return aOrder - bOrder;
  });
}

function calculateWeightedScore(
  criterionScores: CriterionScore[],
  rubricCriteria: RubricCriterion[],
): number {
  const weights = new Map(
    rubricCriteria.map((criterion) => [criterion.id, criterion.weight] as const),
  );
  const totalWeight = rubricCriteria.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );

  if (totalWeight <= 0) {
    throw new Error('Rubric weights must have a positive total.');
  }

  const weighted = criterionScores.reduce(
    (sum, criterionScore) =>
      sum + criterionScore.score * (weights.get(criterionScore.criterionId) ?? 0),
    0,
  );

  return roundScore(weighted / totalWeight);
}

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
