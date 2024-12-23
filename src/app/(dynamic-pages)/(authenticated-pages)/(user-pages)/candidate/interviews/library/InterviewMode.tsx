'use client';

import { InterviewModeCard } from '@/components/Interviews/InterviewLibrary/InterviewModeCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { INTERVIEW_MODES } from '@/utils/constants';

export function InterviewMode() {
  return (
    <div>
      <Card className="mb-6 text-center">
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl text-center">Select Interview Mode</h1>
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="flex justify-center mb-4"></div>

      <div className="flex justify-center h-60">
        <div className="grid grid-cols-2 gap-6">
          {INTERVIEW_MODES.map((mode) => (
            <InterviewModeCard key={mode} name={mode} />
          ))}
        </div>
      </div>
    </div>
  );
}
