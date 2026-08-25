import 'server-only';

import {
  RESPONSE_EVALUATION_SCHEMA_VERSION,
  SESSION_EVALUATION_SCHEMA_VERSION,
} from '@/modules/evaluation/evaluation.service';
import { DrizzleEvaluationRepository } from '@/modules/evaluation/evaluation.repository';
import type {
  ResponseEvaluation,
  SessionEvaluation,
} from '@/modules/evaluation/evaluation.schema';
import type {
  PracticeQuestion,
  RubricCriterion,
} from '@/modules/practice/practice.schema';
import { createPublicSessionService } from '@/modules/session/session.service';
import type { SessionResponse } from '@/modules/session/session.schema';

import { canUseCoachForSession } from './coach.authorization';

export type CoachGroundingContext = {
  sessionId: string;
  practiceTitle: string;
  scenario: string;
  response?: {
    response: SessionResponse;
    question: PracticeQuestion;
    rubricCriteria: RubricCriterion[];
    evaluation: ResponseEvaluation;
  };
  sessionEvaluation?: SessionEvaluation;
};

export type CoachGroundingResult =
  | { status: 'ready'; context: CoachGroundingContext }
  | { status: 'not_found' | 'forbidden' | 'not_complete' | 'evaluation_missing' };

export async function getCoachGroundingContext(input: {
  sessionId: string;
  responseId?: string;
  userId: string;
}): Promise<CoachGroundingResult> {
  const sessionService = createPublicSessionService();
  const context = await sessionService.getContext(input.sessionId);

  if (!context) return { status: 'not_found' };
  if (!canUseCoachForSession(context.session.participantUserId, input.userId)) {
    return { status: 'forbidden' };
  }
  if (context.session.status !== 'completed') {
    return { status: 'not_complete' };
  }

  const evaluations = new DrizzleEvaluationRepository();
  const base: CoachGroundingContext = {
    sessionId: context.session.id,
    practiceTitle: context.practiceVersion.snapshot.title,
    scenario: context.practiceVersion.snapshot.scenario,
  };

  if (input.responseId) {
    const response = context.responses.find((item) => item.id === input.responseId);
    if (!response) return { status: 'not_found' };

    const question = context.practiceVersion.snapshot.questions.find(
      (item) =>
        item.id === response.questionId && item.order === response.questionOrder,
    );
    if (!question) return { status: 'not_found' };

    const evaluation = await evaluations.getResponseEvaluation(
      response.id,
      RESPONSE_EVALUATION_SCHEMA_VERSION,
    );
    if (!evaluation) return { status: 'evaluation_missing' };

    return {
      status: 'ready',
      context: {
        ...base,
        response: {
          response,
          question,
          rubricCriteria: rubricForQuestion(
            question,
            context.practiceVersion.snapshot.rubricCriteria,
          ),
          evaluation,
        },
      },
    };
  }

  const sessionEvaluation = await evaluations.getSessionEvaluation(
    context.session.id,
    SESSION_EVALUATION_SCHEMA_VERSION,
  );
  if (!sessionEvaluation) return { status: 'evaluation_missing' };

  return {
    status: 'ready',
    context: { ...base, sessionEvaluation },
  };
}

function rubricForQuestion(
  question: PracticeQuestion,
  rubric: RubricCriterion[],
): RubricCriterion[] {
  const mappedIds = question.rubricCriterionIds;
  if (!mappedIds || mappedIds.length === 0) return rubric;

  const byId = new Map(rubric.map((criterion) => [criterion.id, criterion] as const));
  return mappedIds
    .map((id) => byId.get(id))
    .filter((criterion): criterion is RubricCriterion => Boolean(criterion));
}
