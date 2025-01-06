'use client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const paramsSchema = z.object({
  interviewId: z.string().optional(),
});

export default function InterviewSessionPage({
  params,
}: {
  params: { interviewId?: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const validateParams = paramsSchema.safeParse(params);
      if (!validateParams.success || !validateParams.data.interviewId) {
        setIsLoading(true);
        router.push('/candidate/interviews/library');
      }
    } catch (error) {
      console.error('Error validating interview session params:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }
}
