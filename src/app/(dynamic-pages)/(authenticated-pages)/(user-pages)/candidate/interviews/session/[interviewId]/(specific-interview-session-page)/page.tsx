'use client';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import InterviewFlow from './InterviewFlow';
import InterviewFlowWrapper from './InterviewFlowWrapper';

const paramsSchema = z.object({
  interviewId: z.string(),
});

export default function InterviewSessionPage({
  params,
}: {
  params: { interviewId: string };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [interviewId, setInterviewId] = useState<string>('');

  useEffect(() => {
    try {
      const parsedParams = paramsSchema.parse(params);
      setInterviewId(parsedParams.interviewId);
    } catch (error) {
      console.error('Invalid parameters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <InterviewFlowWrapper interviewId={interviewId} />;
}
