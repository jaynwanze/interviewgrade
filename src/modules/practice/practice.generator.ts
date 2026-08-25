import 'server-only';

import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import {
  practiceDraftSchema,
  type PracticeDraft,
} from '@/modules/practice/practice.schema';
import { createOpenAIClient } from '@/utils/openai/config';

export const PRACTICE_DRAFT_MODEL = 'gpt-5-mini';
export const PRACTICE_DRAFT_PROMPT_VERSION = 'practice-draft-v1';

const generatedPracticeDraftSchema = z.object({
  title: z.string().trim().min(2).max(64),
  description: z.string().trim().min(10).max(1000),
  scenario: z.string().trim().min(10).max(1500),
  instructions: z.string().trim().min(5).max(1000),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  estimatedDurationMinutes: z.number().int().min(5).max(90),
  rubricCriteria: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        description: z.string().trim().min(5).max(1000),
        importance: z.number().int().min(1).max(5),
      }),
    )
    .min(2)
    .max(6),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(5).max(1000),
        guidance: z.string().trim().min(3).max(1000),
        preparationSeconds: z.number().int().min(0).max(120),
        responseSeconds: z.number().int().min(30).max(300),
        rubricCriterionIndexes: z
          .array(z.number().int().min(0).max(5))
          .min(1)
          .max(6),
      }),
    )
    .min(3)
    .max(8),
});

type GeneratedPracticeDraft = z.infer<typeof generatedPracticeDraftSchema>;

export async function generatePracticeDraft(input: {
  brief: string;
  questionCount: number;
}): Promise<PracticeDraft> {
  const brief = z.string().trim().min(20).max(30_000).parse(input.brief);
  const questionCount = z.number().int().min(3).max(8).parse(input.questionCount);

  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model: PRACTICE_DRAFT_MODEL,
    instructions:
      "You are InterviewGrade's practice designer. Turn the user's brief into a focused, realistic spoken practice session. The output is only a draft: make it useful and specific, but never claim facts about an employer, role, candidate, or process that are not in the brief. Questions must be answerable aloud. Rubric criteria must be distinct, evidence-based, and reusable across the session. Map every question to only the criteria that genuinely apply, and make sure every rubric criterion is used by at least one question. Use a short, specific Practice title of ideally 2-5 words. Prefer a compact subject + interview type label such as 'SWE Behavioral Practice', 'Backend Interview Practice', 'Leadership Behavioral', or 'Frontend System Design'. Do not include audience qualifiers like early-career, senior, candidate, or role level unless they are essential to distinguish the Practice. Never write a sentence or repeat the full user brief. Return only the requested structured output.",
    input: `Create an InterviewGrade practice from this brief:\n\n${brief}\n\nTarget exactly ${questionCount} questions. Use 2-5 rubric criteria. Importance is a relative value from 1 (supporting) to 5 (most important); InterviewGrade will convert it into weights that total exactly 100%. Keep the title to 2-5 words whenever possible and make it dashboard-friendly. Keep preparation and response times realistic for spoken answers.`,
    max_output_tokens: 6000,
    text: {
      format: {
        type: 'json_schema',
        name: 'interviewgrade_practice_draft',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 2, maxLength: 64 },
            description: { type: 'string', minLength: 10, maxLength: 1000 },
            scenario: { type: 'string', minLength: 10, maxLength: 1500 },
            instructions: { type: 'string', minLength: 5, maxLength: 1000 },
            difficulty: {
              type: 'string',
              enum: ['Easy', 'Medium', 'Hard'],
            },
            estimatedDurationMinutes: {
              type: 'integer',
              minimum: 5,
              maximum: 90,
            },
            rubricCriteria: {
              type: 'array',
              minItems: 2,
              maxItems: 6,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 120 },
                  description: {
                    type: 'string',
                    minLength: 5,
                    maxLength: 1000,
                  },
                  importance: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5,
                  },
                },
                required: ['name', 'description', 'importance'],
              },
            },
            questions: {
              type: 'array',
              minItems: 3,
              maxItems: 8,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  prompt: { type: 'string', minLength: 5, maxLength: 1000 },
                  guidance: { type: 'string', minLength: 3, maxLength: 1000 },
                  preparationSeconds: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 120,
                  },
                  responseSeconds: {
                    type: 'integer',
                    minimum: 30,
                    maximum: 300,
                  },
                  rubricCriterionIndexes: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 6,
                    items: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 5,
                    },
                  },
                },
                required: [
                  'prompt',
                  'guidance',
                  'preparationSeconds',
                  'responseSeconds',
                  'rubricCriterionIndexes',
                ],
              },
            },
          },
          required: [
            'title',
            'description',
            'scenario',
            'instructions',
            'difficulty',
            'estimatedDurationMinutes',
            'rubricCriteria',
            'questions',
          ],
        },
      },
    },
  });

  if (response.status === 'incomplete') {
    throw new Error(
      `The practice drafting model returned an incomplete response: ${response.incomplete_details?.reason ?? 'unknown reason'}.`,
    );
  }

  if (!response.output_text) {
    throw new Error('The practice drafting model returned no structured output.');
  }

  const generated = generatedPracticeDraftSchema.parse(
    JSON.parse(response.output_text) as unknown,
  );

  if (generated.questions.length !== questionCount) {
    throw new Error(
      `The practice drafting model returned ${generated.questions.length} questions instead of ${questionCount}.`,
    );
  }

  return buildPracticeDraft(generated);
}

function buildPracticeDraft(generated: GeneratedPracticeDraft): PracticeDraft {
  const weights = normalizeImportanceWeights(
    generated.rubricCriteria.map((criterion) => criterion.importance),
  );
  const criterionIds = generated.rubricCriteria.map(() => randomUUID());

  const rubricCriteria = generated.rubricCriteria.map((criterion, index) => ({
    id: criterionIds[index]!,
    order: index,
    name: criterion.name,
    description: criterion.description,
    weight: weights[index]!,
  }));

  const questions = generated.questions.map((question, index) => {
    const mappedIndexes = Array.from(
      new Set(
        question.rubricCriterionIndexes.filter(
          (criterionIndex) => criterionIndex < criterionIds.length,
        ),
      ),
    );
    const safeIndexes =
      mappedIndexes.length > 0
        ? mappedIndexes
        : criterionIds.map((_, criterionIndex) => criterionIndex);

    return {
      id: randomUUID(),
      order: index,
      prompt: question.prompt,
      guidance: question.guidance,
      preparationSeconds: question.preparationSeconds,
      responseSeconds: question.responseSeconds,
      rubricCriterionIds: safeIndexes.map(
        (criterionIndex) => criterionIds[criterionIndex]!,
      ),
    };
  });

  criterionIds.forEach((criterionId, criterionIndex) => {
    const isUsed = questions.some((question) =>
      question.rubricCriterionIds.includes(criterionId),
    );
    if (!isUsed) {
      const target = questions[criterionIndex % questions.length]!;
      target.rubricCriterionIds = [...target.rubricCriterionIds, criterionId];
    }
  });

  return practiceDraftSchema.parse({
    title: generated.title,
    description: generated.description,
    scenario: generated.scenario,
    instructions: generated.instructions,
    difficulty: generated.difficulty,
    estimatedDurationMinutes: generated.estimatedDurationMinutes,
    questions,
    rubricCriteria,
  });
}

function normalizeImportanceWeights(importances: number[]): number[] {
  const total = importances.reduce((sum, importance) => sum + importance, 0);
  if (total <= 0) {
    throw new Error('Generated rubric importance must have a positive total.');
  }

  const exact = importances.map((importance) => (importance / total) * 100);
  const weights = exact.map((value) => Math.floor(value));
  let remaining = 100 - weights.reduce((sum, weight) => sum + weight, 0);

  const remainderOrder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let index = 0; index < remainderOrder.length && remaining > 0; index++) {
    weights[remainderOrder[index]!.index]! += 1;
    remaining -= 1;
  }

  if (weights.some((weight) => weight <= 0)) {
    throw new Error('Generated rubric weights must all be positive.');
  }

  return weights;
}
