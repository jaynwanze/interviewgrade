import { randomUUID } from 'node:crypto';

import type {
  PracticeQuestion,
  RubricCriterion,
} from '@/modules/practice/practice.schema';
import {
  RESPONSE_EVALUATION_MODEL,
  RESPONSE_PROMPT_VERSION,
  generateResponseEvaluation,
} from '@/modules/evaluation/evaluation.generator';
import { createDrizzleEvaluationRepository } from '@/modules/evaluation/evaluation.repository';
import { responseEvaluationSchema } from '@/modules/evaluation/evaluation.schema';
import { RESPONSE_EVALUATION_SCHEMA_VERSION } from '@/modules/evaluation/evaluation.service';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackRequestSchema = z.object({
  sessionId: z.string().min(1).max(160),
});

const FEEDBACK_STATUS_HEADER = 'X-InterviewGrade-Feedback-Status';

export async function POST(request: NextRequest) {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid practice feedback request.' },
      { status: 400 },
    );
  }

  const parsed = feedbackRequestSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid practice feedback request.' },
      { status: 400 },
    );
  }

  const loggedInUser = await serverGetOptionalLoggedInUser();

  try {
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const service = createPublicSessionService();
    const context = await service.getAccessibleContext(
      parsed.data.sessionId,
      loggedInUser?.id ?? null,
    );

    if (!context) {
      return NextResponse.json(
        { error: 'Session or response was not found.' },
        { status: 404 },
      );
    }

    if (context.session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Practice feedback is only available during an active session.' },
        { status: 409 },
      );
    }

    const currentQuestionOrder = context.session.currentQuestionOrder;
    const orderedQuestions = [...context.practiceVersion.snapshot.questions].sort(
      (a, b) => a.order - b.order,
    );
    const questionIndex = orderedQuestions.findIndex(
      (question) => question.order === currentQuestionOrder,
    );
    const currentQuestion = orderedQuestions[questionIndex];

    if (!currentQuestion || questionIndex < 0 || !currentQuestion.id) {
      return NextResponse.json(
        { error: 'Current practice question is unavailable.' },
        { status: 409 },
      );
    }

    const savedResponses = context.responses
      .filter(
        (response) =>
          response.questionId === currentQuestion.id &&
          response.questionOrder === currentQuestionOrder,
      )
      .sort((a, b) => b.attemptNumber - a.attemptNumber);
    const savedResponse = savedResponses[0];

    if (!savedResponse) {
      return NextResponse.json(
        { error: 'Save the response before requesting feedback.' },
        { status: 409 },
      );
    }

    const nextQuestion = orderedQuestions[questionIndex + 1] ?? null;
    const mappedRubric = rubricForQuestion(
      currentQuestion,
      context.practiceVersion.snapshot.rubricCriteria,
    );

    try {
      const repository = createDrizzleEvaluationRepository();
      let evaluation = await repository.getResponseEvaluation(
        savedResponse.id,
        RESPONSE_EVALUATION_SCHEMA_VERSION,
      );

      if (!evaluation) {
        const generated = await generateResponseEvaluation({
          practiceTitle: context.practiceVersion.snapshot.title,
          scenario: context.practiceVersion.snapshot.scenario,
          question: currentQuestion,
          response: savedResponse,
          rubricCriteria: mappedRubric,
        });

        evaluation = await repository.saveResponseEvaluation(
          responseEvaluationSchema.parse({
            id: randomUUID(),
            sessionResponseId: savedResponse.id,
            overallScore: generated.overallScore,
            criterionScores: generated.criterionScores,
            summary: generated.summary,
            strengths: generated.strengths,
            improvements: generated.improvements,
            recommendation: generated.recommendation,
            schemaVersion: RESPONSE_EVALUATION_SCHEMA_VERSION,
            modelMetadata: {
              provider: 'openai',
              model: RESPONSE_EVALUATION_MODEL,
              promptVersion: RESPONSE_PROMPT_VERSION,
            },
            createdAt: new Date(),
          }),
        );
      }

      return feedbackEvaluationStream(evaluation, nextQuestion != null);
    } catch (error) {
      console.error('v2 practice feedback evaluation failed', error);
      return feedbackUnavailableStream(nextQuestion != null);
    }
  } catch (error) {
    console.error('v2 practice feedback context unavailable', error);
    return NextResponse.json(
      { error: 'Practice feedback is temporarily unavailable.' },
      { status: 503 },
    );
  }
}

function rubricForQuestion(
  question: PracticeQuestion,
  rubricCriteria: RubricCriterion[],
): RubricCriterion[] {
  const mappedIds = question.rubricCriterionIds;
  if (!mappedIds || mappedIds.length === 0) return rubricCriteria;

  const rubricById = new Map(
    rubricCriteria.map((criterion) => [criterion.id, criterion] as const),
  );
  const mapped = mappedIds
    .map((criterionId) => rubricById.get(criterionId))
    .filter((criterion): criterion is RubricCriterion => Boolean(criterion));

  return mapped.length > 0 ? mapped : rubricCriteria;
}

function feedbackEvaluationStream(
  evaluation: ReturnType<typeof responseEvaluationSchema.parse>,
  hasNextQuestion: boolean,
) {
  const text = `Practice Feedback\nScore (%):\n${Math.round(evaluation.overallScore)}/100%\n\nSummary: ${evaluation.summary ?? 'Your answer was evaluated against the published rubric.'}\nAdvice for Next Question: ${hasNextQuestion ? evaluation.recommendation : 'N/A'}`;
  return singleEventStream(text, 'ready');
}

function feedbackUnavailableStream(hasNextQuestion: boolean) {
  const fallback = `Practice Feedback\n\nSummary: Your answer was saved successfully, but immediate AI feedback is temporarily unavailable.\nAdvice for Next Question: ${hasNextQuestion ? 'Continue to the next question and focus on a clear, specific response.' : 'N/A'}`;
  return singleEventStream(fallback, 'fallback');
}

function singleEventStream(text: string, status: 'ready' | 'fallback') {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(text)}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(body, {
    headers: streamHeaders(status),
  });
}

function streamHeaders(status: 'ready' | 'fallback') {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    [FEEDBACK_STATUS_HEADER]: status,
  };
}
