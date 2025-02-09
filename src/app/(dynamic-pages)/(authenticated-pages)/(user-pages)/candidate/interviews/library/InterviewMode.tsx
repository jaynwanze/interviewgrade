'use client';

import { InterviewModeCard } from '@/components/Interviews/InterviewLibrary/InterviewModeCard';
import { Separator } from '@/components/ui/separator';
import { INTERVIEW_MODES } from '@/utils/constants';

export function InterviewMode() {
  return (
    <div className="p-2 mx-auto max-w-4xl">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1"> Select Interview Mode</h1>
        <p className="text-gray-500">
          Choose the best mode for your mock interview experience.
        </p>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mt-6">
        {INTERVIEW_MODES.map((mode) => (
          <InterviewModeCard key={mode} name={mode} />
        ))}
      </div>
    </div>
  );
}
