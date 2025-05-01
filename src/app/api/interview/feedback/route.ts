// app/api/interview/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import {
  EvaluationCriteriaType,
  Interview,
  InterviewAnswerDetail,
} from '@/types';

// POST /api/interview/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interview, criteria, answers } = body as {
      interview: Interview;
      criteria: EvaluationCriteriaType[];
      answers: InterviewAnswerDetail[];
    };

    // <-- the heavy part
    const feedback = await getInterviewFeedback(interview, criteria, answers);

    return NextResponse.json({ status: 'ok', feedback }, { status: 200 });
  } catch (err) {
    console.error('feedback route error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'unknown error' },
      { status: 500 },
    );
  }
}
