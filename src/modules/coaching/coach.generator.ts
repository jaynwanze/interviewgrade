import 'server-only';

import { isInterviewGradeE2EMode } from '@/modules/testing/e2e-mode';
import { createOpenAIClient } from '@/utils/openai/config';

import { coachAnswerSchema, type CoachAnswer } from './coach.schema';
import type { CoachGroundingContext } from './coach.service';

export const COACH_MODEL = 'gpt-5-mini';
export const COACH_PROMPT_VERSION = 'practice-coach-v1';

export async function generateCoachAnswer(input: {
  question: string;
  grounding: CoachGroundingContext;
}): Promise<CoachAnswer> {
  if (isInterviewGradeE2EMode()) {
    return {
      answer:
        'E2E Coach fixture: this answer is grounded in the persisted Practice report and does not change the authoritative evaluation.',
    };
  }

  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model: COACH_MODEL,
    instructions:
      "You are InterviewGrade's contextual Practice Coach. Answer only from the supplied Practice, transcript, rubric and persisted evaluation, plus clearly-labelled general interview guidance. Never rescore or contradict the authoritative evaluation. Never invent personal experience, achievements or facts. When suggesting a rewrite, use only facts present in the transcript or use obvious placeholders. Do not infer personality, emotion, confidence, honesty, employability, protected traits, or hiring suitability. Keep the answer concise and practical.",
    input: buildCoachPrompt(input.question, input.grounding),
    max_output_tokens: 1200,
  });

  if (response.status === 'incomplete') {
    throw new Error(
      `The Coach model returned an incomplete response: ${response.incomplete_details?.reason ?? 'unknown reason'}.`,
    );
  }

  return coachAnswerSchema.parse({ answer: response.output_text?.trim() });
}

export function buildCoachPrompt(
  question: string,
  grounding: CoachGroundingContext,
): string {
  const packet = grounding.response
    ? {
        scope: 'response',
        practiceTitle: grounding.practiceTitle,
        scenario: grounding.scenario,
        question: {
          prompt: grounding.response.question.prompt,
          guidance: grounding.response.question.guidance ?? null,
        },
        rubricCriteria: grounding.response.rubricCriteria.map((criterion) => ({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
        })),
        transcript: grounding.response.response.transcript,
        persistedEvaluation: grounding.response.evaluation,
      }
    : {
        scope: 'session',
        practiceTitle: grounding.practiceTitle,
        scenario: grounding.scenario,
        persistedSessionEvaluation: grounding.sessionEvaluation,
      };

  return `User question:\n${question}\n\nTrusted grounding packet:\n${JSON.stringify(packet, null, 2)}\n\nAnswer the user's question without changing or recalculating the persisted score.`;
}
