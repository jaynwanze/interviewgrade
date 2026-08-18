import type {
  PracticeQuestion,
  RubricCriterion,
} from '@/modules/practice/practice.schema';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';
import { createOpenAIClient, hasOpenAIApiKey } from '@/utils/openai/config';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackRequestSchema = z.object({
  sessionId: z.string().min(1).max(160),
  responseId: z.string().min(1).max(160),
});

const FEEDBACK_MODEL = 'gpt-5-mini';
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

    const savedResponse = context.responses.find(
      (response) => response.id === parsed.data.responseId,
    );
    if (!savedResponse) {
      return NextResponse.json(
        { error: 'Session or response was not found.' },
        { status: 404 },
      );
    }

    const orderedQuestions = [...context.practiceVersion.snapshot.questions].sort(
      (a, b) => a.order - b.order,
    );
    const questionIndex = orderedQuestions.findIndex(
      (question) =>
        question.id === savedResponse.questionId &&
        question.order === savedResponse.questionOrder,
    );
    const currentQuestion = orderedQuestions[questionIndex];

    if (!currentQuestion || questionIndex < 0) {
      return NextResponse.json(
        { error: 'Saved response question is unavailable.' },
        { status: 409 },
      );
    }

    const nextQuestion = orderedQuestions[questionIndex + 1] ?? null;
    const mappedRubric = rubricForQuestion(
      currentQuestion,
      context.practiceVersion.snapshot.rubricCriteria,
    );

    if (!hasOpenAIApiKey()) {
      console.error(
        'v2 practice feedback unavailable: OPENAI_API_KEY/OPENAI_SECRET_KEY is not configured',
      );
      return feedbackUnavailableStream(nextQuestion != null);
    }

    const snapshot = context.practiceVersion.snapshot;
    const rubric = mappedRubric
      .map(
        (criterion, index) =>
          `${index + 1}. ${criterion.name} (${criterion.weight}%): ${criterion.description}`,
      )
      .join('\n');

    const instructions = `You are InterviewGrade's concise practice coach. Evaluate one spoken answer against the supplied weighted rubric. Score the answer from 0 to 100. Be demanding but constructive. Do not invent facts that are not present in the answer. If the answer is irrelevant or empty in substance, score it very low. Return only this exact plain-text structure:\n\nPractice Feedback\nScore (%):\n<integer>/100%\n\nSummary: <2-4 concise sentences>\nAdvice for Next Question: <1-2 actionable sentences, or N/A when there is no next question>`;

    const prompt = `Practice: ${snapshot.title}\n\nScenario:\n${snapshot.scenario}\n\nWeighted rubric:\n${rubric}\n\nCurrent question:\n${currentQuestion.prompt}\n\nQuestion guidance:\n${currentQuestion.guidance ?? 'None'}\n\nCandidate answer:\n${savedResponse.transcript}\n\nNext question:\n${nextQuestion?.prompt ?? 'N/A'}`;

    try {
      const openai = createOpenAIClient();
      const stream = await openai.responses.create({
        model: FEEDBACK_MODEL,
        instructions,
        input: prompt,
        max_output_tokens: 260,
        stream: true,
      });

      const encoder = new TextEncoder();
      const body = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === 'response.output_text.delta') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event.delta)}\n\n`),
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            console.error('v2 practice feedback stream failed', error);
            const fallback = buildUnavailableFeedback(nextQuestion != null);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(fallback)}\n\n`),
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(body, {
        headers: streamHeaders('ready'),
      });
    } catch (error) {
      console.error('v2 practice feedback request failed', error);
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

function feedbackUnavailableStream(hasNextQuestion: boolean) {
  const encoder = new TextEncoder();
  const fallback = buildUnavailableFeedback(hasNextQuestion);
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(fallback)}\n\n`),
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(body, {
    headers: streamHeaders('fallback'),
  });
}

function buildUnavailableFeedback(hasNextQuestion: boolean) {
  return `Practice Feedback\n\nSummary: Your answer was saved successfully, but immediate AI feedback is temporarily unavailable.\nAdvice for Next Question: ${hasNextQuestion ? 'Continue to the next question and focus on a clear, specific response.' : 'N/A'}`;
}

function streamHeaders(status: 'ready' | 'fallback') {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    [FEEDBACK_STATUS_HEADER]: status,
  };
}
