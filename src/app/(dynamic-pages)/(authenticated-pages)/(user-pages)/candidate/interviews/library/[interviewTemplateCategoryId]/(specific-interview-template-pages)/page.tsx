'use client';

import { z } from 'zod';
import { InterviewTemplates } from './InterviewTemplates';

const paramsSchema = z.object({
  interviewTemplateCategoryId: z.string(),
});

export default function InterviewsPage({
  params,
}: {
  params: { interviewTemplateCategoryId: string };
}) {
  const parsedParams = paramsSchema.parse(params);
  const { interviewTemplateCategoryId } = parsedParams;

  return (
    <InterviewTemplates
    interviewMode={interviewTemplateCategoryId}
    />
  );
}
