// app/api/interview/feedback/route.ts
import {
  EvaluationCriteriaType,
  Interview,
  InterviewAnswerDetail,
} from '@/types';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const memory = 1024;
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { interview, criteria, answers } = (await req.json()) as {
      interview: Interview;
      criteria: EvaluationCriteriaType[];
      answers: InterviewAnswerDetail[];
    };

    const feedback = await getInterviewFeedback(interview, criteria, answers);

    return NextResponse.json({ status: 'ok', feedback }, { status: 200 });
  } catch (err) {
    console.error('[api/interview/feedback] error:', err);
    return NextResponse.json(
      { status: 'error', message: (err as Error).message ?? 'unknown error' },
      { status: 500 },
    );
  }
}
