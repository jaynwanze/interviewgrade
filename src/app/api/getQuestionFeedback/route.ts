import { InterviewQuestion } from '@/types';
import { getQuestionFeedback } from '@/utils/openai/getQuestionFeedback';
import { NextRequest, NextResponse } from 'next/server';
/**
 * Handles the POST request
 */
export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const {
    skill,
    currentQuestion,
    currentAnswer,
    nextQuestion,
    interview_question_count,
  } = await req.json();

  try {
    const stream = await getQuestionFeedback(
      skill,
      currentQuestion as InterviewQuestion,
      currentAnswer,
      nextQuestion as InterviewQuestion | null,
      interview_question_count,
    );

    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const data = chunk.choices?.[0]?.delta?.content;
          if (data) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
            );
            console.log('data:', data);
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new NextResponse(readableStream, { headers });
  } catch (error) {
    console.error('Error fetching feedback:', error.message || error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
