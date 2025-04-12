'use client';

import { z } from 'zod';
import InterviewAnalytics from './InterviewAnalytics';

const paramsSchema = z.object({
  templateId: z.string(),
});

export default function InterviewsPage({
  params,
}: {
  params: { templateId: string };
}) {
  const parsedParams = paramsSchema.parse(params);
  const { templateId } = parsedParams;

  return <InterviewAnalytics templateId={templateId} />;
}
