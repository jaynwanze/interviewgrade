'use client';

import { z } from 'zod';
import InterviewFlow from './InterviewFlow';

const paramsSchema = z.object({
  interviewId: z.string(),
});

export default function InterviewSessionPage({
  params,
}: {
  params: { interviewId: string };
}) {
  const parsedParams = paramsSchema.parse(params);
  const { interviewId } = parsedParams;

  return <InterviewFlow interviewId={interviewId} />;
}
