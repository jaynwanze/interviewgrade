'use client';

import { z } from 'zod';
import InterviewHistoryPage from './InterviewHistoryPage';

const paramsSchema = z.object({
  candidateId: z.string(),
});

export default function InterviewHistory({
  params,
}: {
  params: { candidateId: string };
}) {
  const parsedParams = paramsSchema.parse(params);
  const { candidateId } = parsedParams;

  return <InterviewHistoryPage candidateId={candidateId} />;
}
