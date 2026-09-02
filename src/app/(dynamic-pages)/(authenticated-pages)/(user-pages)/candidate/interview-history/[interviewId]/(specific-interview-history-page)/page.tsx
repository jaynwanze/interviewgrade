'use client';;
import { use } from "react";

import { z } from 'zod';
import InterviewHistoryDetailsPage from './InterviewHistoryDetailsPage';

const paramsSchema = z.object({
  interviewId: z.string(),
});

export default function InterviewHistory(
  props: {
    params: Promise<{ interviewId: string }>;
  }
) {
  const params = use(props.params);
  const parsedParams = paramsSchema.parse(params);
  const { interviewId } = parsedParams;

  return <InterviewHistoryDetailsPage interviewId={interviewId} />;
}
