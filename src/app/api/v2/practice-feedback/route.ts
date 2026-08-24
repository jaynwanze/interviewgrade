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
  currentAnswer: z.string().trim().min(1),
});

const FEEDBACK_STATUS_HEADER = 'X-InterviewGrade-Feedback-Status';

type PersistedResponseEvaluation = ReturnType<
  typeof responseEvaluationSchema.parse
>;

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

    const orderedQuestions = [...context.practiceVersion.snapshot.questions].sort(
      (a, b) => a.order - b.order,
    );

    // The participant can advance the durable session pointer as soon as an answer
    // is saved. Do not infer the answer being evaluated from currentQuestionOrder,
    // because by the time this request reaches the server that pointer may already
    // refer to the following question.
    const savedResponse = [...context.responses]
      .filter((response) => response.transcript.trim() === parsed.data.currentAnswer)
      .sort(
        (a, b) =>
          b.submittedAt.getTime() - a.submittedAt.getTime() ||
          b.attemptNumber - a.attemptNumber,
      )[0];

    if (!savedResponse) {
      return NextResponse.json(
        { error: 'Save the response before requesting feedback.' },
        { status: 409 },
      );
    }

    const questionIndex = orderedQuestions.findIndex(
      (question) =>
        question.id === savedResponse.questionId &&
        question.order === savedResponse.questionOrder,
    );
    const currentQuestion = orderedQuestions[questionIndex];

    if (!currentQuestion || questionIndex < 0 || !currentQuestion.id) {
      return NextResponse.json(
        { error: 'Answered practice question is unavailable.' },
        { status: 409 },
      );
    }

    const nextQuestion = orderedQuestions[questionIndex + 1] ?? null;
    const mappedRubric = rubricForQuestion(
      currentQuestion,
      context.practiceVersion.snapshot.rubricCriteria,
    );

    const loadEvaluation = async (): Promise<PersistedResponseEvaluation> => {
      const repository = createDrizzleEvaluationRepository();
      let evaluation = await repository.getResponseEvaluation(
        savedResponse.id,
        RESPONSE_EVALUATION_SCHEMA_VERSION,
      );

      if (evaluation) {
        return evaluation;
      }

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

      return evaluation;
    };

    return feedbackEvaluationStream(loadEvaluation, nextQuestion != null);
  } catch (error) {
    console.error('practice feedback context unavailable', error);
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
  loadEvaluation: () => Promise<PersistedResponseEvaluation>,
  hasNextQuestion: boolean,
) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(text)}\n\n`),
        );
      };

      // Open the stream immediately so the participant never sits behind a blank
      // spinner while the structured rubric evaluation is being generated.
      send('Response saved. Evaluating against your rubric…');

      try {
        const evaluation = await loadEvaluation();

        // Reveal useful feedback progressively while preserving the same persisted
        // structured evaluation used by reports and creator analytics.
        send(
          `\n\nPractice Feedback\nScore (%):\n${Math.round(evaluation.overallScore)}/100%`,
        );
        send(
          `\n\nSummary: ${evaluation.summary ?? 'Your answer was evaluated against the published rubric.'}`,
        );
        send(
          `\nAdvice for Next Question: ${hasNextQuestion ? evaluation.recommendation : 'N/A'}`,
        );
      } catch (error) {
        console.error('practice feedback evaluation failed', error);
        send(
          '\n\nPractice Feedback\n\nSummary: Your answer was saved successfully, but immediate AI feedback is temporarily unavailable.',
        );
        send(
          `\nAdvice for Next Question: ${hasNextQuestion ? 'Continue to the next question and focus on a clear, specific response.' : 'N/A'}`,
        );
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new NextResponse(body, {
    headers: streamHeaders(),
  });
}

function streamHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    [FEEDBACK_STATUS_HEADER]: 'streaming',
  };
}
