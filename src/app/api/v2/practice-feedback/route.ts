import { createOpenAIClient, hasOpenAIApiKey } from '@/utils/openai/config';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const feedbackRequestSchema = z.object({
  practiceTitle: z.string().min(1).max(200),
  scenario: z.string().min(1).max(4000),
  currentQuestion: z.object({
    prompt: z.string().min(1).max(2000),
    guidance: z.string().max(2000).optional().nullable(),
  }),
  currentAnswer: z.string().refine((value) => value.trim().length > 0),
  nextQuestion: z
    .object({ prompt: z.string().min(1).max(2000) })
    .optional()
    .nullable(),
  rubricCriteria: z
    .array(
      z.object({
        name: z.string().min(1).max(160),
        description: z.string().min(1).max(2000),
        weight: z.number().positive().max(100),
      }),
    )
    .min(1)
    .max(20),
});

const FEEDBACK_MODEL = 'gpt-5-mini';
const FEEDBACK_STATUS_HEADER = 'X-InterviewGrade-Feedback-Status';

export async function POST(request: NextRequest) {
  const parsed = feedbackRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid practice feedback request.' },
      { status: 400 },
    );
  }

  if (!hasOpenAIApiKey()) {
    console.error(
      'v2 practice feedback unavailable: OPENAI_API_KEY/OPENAI_SECRET_KEY is not configured',
    );
    return feedbackUnavailableStream(parsed.data.nextQuestion != null);
  }

  const input = parsed.data;
  const rubric = input.rubricCriteria
    .map(
      (criterion, index) =>
        `${index + 1}. ${criterion.name} (${criterion.weight}%): ${criterion.description}`,
    )
    .join('\n');

  const instructions = `You are InterviewGrade's concise practice coach. Evaluate one spoken answer against the supplied weighted rubric. Score the answer from 0 to 100. Be demanding but constructive. Do not invent facts that are not present in the answer. If the answer is irrelevant or empty in substance, score it very low. Return only this exact plain-text structure:\n\nPractice Feedback\nScore (%):\n<integer>/100%\n\nSummary: <2-4 concise sentences>\nAdvice for Next Question: <1-2 actionable sentences, or N/A when there is no next question>`;

  const prompt = `Practice: ${input.practiceTitle}\n\nScenario:\n${input.scenario}\n\nWeighted rubric:\n${rubric}\n\nCurrent question:\n${input.currentQuestion.prompt}\n\nQuestion guidance:\n${input.currentQuestion.guidance ?? 'None'}\n\nCandidate answer:\n${input.currentAnswer}\n\nNext question:\n${input.nextQuestion?.prompt ?? 'N/A'}`;

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
          const fallback = buildUnavailableFeedback(input.nextQuestion != null);
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
    return feedbackUnavailableStream(input.nextQuestion != null);
  }
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
