'use client';

import { z } from 'zod';
import InterviewHistoryDetailsPage from './InterviewHistoryDetailsPage';

const paramsSchema = z.object({
  interviewId: z.string(),
});

export default function InterviewHistory({
  params,
}: {
  params: { interviewId: string };
}) {
  const parsedParams = paramsSchema.parse(params);
  const { interviewId } = parsedParams;

  return <InterviewHistoryDetailsPage interviewId={interviewId} />;
}
