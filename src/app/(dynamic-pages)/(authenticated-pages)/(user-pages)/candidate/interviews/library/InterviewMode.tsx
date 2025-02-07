'use client';

import { InterviewModeCard } from '@/components/Interviews/InterviewLibrary/InterviewModeCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { INTERVIEW_MODES } from '@/utils/constants';

export function InterviewMode() {
  return (
    <div>
      <Card className="mb-6 text-center">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Select Interview Mode
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="mt-4 flex items-center justify-center min-h-[50vh]">
      <div className="grid grid-cols-2 gap-6">
          {INTERVIEW_MODES.map((mode) => (
            <InterviewModeCard key={mode} name={mode} />
          ))}
        </div>
      </div>
    </div>
  );
}
