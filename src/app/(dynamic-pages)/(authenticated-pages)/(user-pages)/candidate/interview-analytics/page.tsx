'use client';

import { Suspense } from 'react';
import InterviewAnalytics from './InterviewAnalytics';

export default function InterviewAnaltyicsPage() {
  return (
    <div>
      <Suspense>
        <InterviewAnalytics />
      </Suspense>
    </div>
  );
}
