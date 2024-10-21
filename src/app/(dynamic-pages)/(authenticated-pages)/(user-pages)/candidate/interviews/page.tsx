'use client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useEffect } from 'react';

const paramsSchema = z.object({
  interviewId: z.string().optional(),
});

export default function InterviewSessionPage({
  params,
}: {
  params: { interviewId?: string };
}) {
  const router = useRouter();

  useEffect(() => {
    if (!params || !params.interviewId) {
      router.push('/candidate/interviews/library');
    }
  }, [params, router]);

  if (!params || !params.interviewId) {
    return null; // Render nothing while redirecting
  }
}