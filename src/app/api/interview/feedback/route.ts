import {
  EvaluationCriteriaType,
  Interview,
  InterviewAnswerDetail,
} from '@/types';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await serverGetOptionalLoggedInUser();
    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const { interview, criteria, answers } = (await req.json()) as {
      interview: Interview;
      criteria: EvaluationCriteriaType[];
      answers: InterviewAnswerDetail[];
    };

    if (!interview || interview.candidate_id !== user.id) {
      return NextResponse.json(
        { status: 'error', message: 'Interview not found.' },
        { status: 404 },
      );
    }

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
