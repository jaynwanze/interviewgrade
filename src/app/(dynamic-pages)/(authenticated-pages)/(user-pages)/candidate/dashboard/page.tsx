'use client';

import { Suspense } from 'react';

import InterviewTemplatesPage from './InterviewTemplatesPage';

export default function InterviewAnaltyicsPage() {
  return (
    <div>
      <Suspense>
        <InterviewTemplatesPage />
      </Suspense>
    </div>
  );
}
