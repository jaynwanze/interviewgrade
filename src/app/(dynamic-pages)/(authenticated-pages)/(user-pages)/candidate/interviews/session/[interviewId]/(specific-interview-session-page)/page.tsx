import { LoadingSpinner } from '@/components/LoadingSpinner';
import { canStartSession } from '@/data/user/candidate';
import { getInterviewById } from '@/data/user/interviews';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import InterviewFlowWrapper from './InterviewFlowWrapper';

const paramsSchema = z.object({
  interviewId: z.string(),
});

export default async function InterviewSessionPage({
  params,
}: {
  params: { interviewId: string };
}) {
  // Validate params
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    redirect('/candidate/interviews');
  }

  const interviewId = parsedParams.data.interviewId;

  // Get the interview to check its mode
  const interview = await getInterviewById(interviewId);

  if (!interview) {
    redirect('/candidate/interviews');
  }

  // Check if this is a new/pending interview (not already started/completed)
  const isNewInterview = interview.status === 'pending' || !interview.status;

  if (isNewInterview) {
    // Check usage limits
    const mode = interview.mode === INTERVIEW_PRACTICE_MODE ? 'practice' : 'interview';
    const access = await canStartSession(mode);

    if (!access.allowed) {
      // Redirect to billing page
      redirect('/candidate/settings/billing');
    }
  }

  return <InterviewFlowWrapper interviewId={interviewId} />;
}