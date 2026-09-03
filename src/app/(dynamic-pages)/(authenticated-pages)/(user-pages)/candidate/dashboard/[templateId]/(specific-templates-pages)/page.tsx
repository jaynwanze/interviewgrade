'use client';;
import { use } from "react";

import { z } from 'zod';
import InterviewAnalytics from './InterviewAnalytics';

const paramsSchema = z.object({
  templateId: z.string(),
});

export default function InterviewsPage(
  props: {
    params: Promise<{ templateId: string }>;
  }
) {
  const params = use(props.params);
  const parsedParams = paramsSchema.parse(params);
  const { templateId } = parsedParams;

  return <InterviewAnalytics templateId={templateId} />;
}
