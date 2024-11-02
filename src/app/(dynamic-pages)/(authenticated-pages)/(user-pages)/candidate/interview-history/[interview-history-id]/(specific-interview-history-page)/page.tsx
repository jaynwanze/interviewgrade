'use client';

import { z } from 'zod';
import InterviewHistoryDetailsPage from './InterviewHistoryDetailsPage';

const paramsSchema = z.object({
  historyId: z.string(),
});

export default function InterviewHistory({
  params,
}: {
  params: { historyId: string };
}) {
  const parsedParams = paramsSchema.parse(params);
  const { historyId } = parsedParams;

  return <InterviewHistoryDetailsPage historyId={historyId} />;
}
