'use client';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { InterviewMode } from '@/types';
import {
  INTERVIEW_INTERVIEW_MODE,
  INTERVIEW_MODE_INTERVIEW_DESCRIPTION,
  INTERVIEW_MODE_PRACTICE_DESCRIPTION,
} from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { Button } from '../../ui/button';

export const InterviewModeCard = (interviewMode: InterviewMode) => {
  const interviewModeNameDisplay: string =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE ? 'Interview' : 'Practice';
  const interviewDescription: string =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE
      ? INTERVIEW_MODE_INTERVIEW_DESCRIPTION
      : INTERVIEW_MODE_PRACTICE_DESCRIPTION;

  const router = useRouter();

  const handleClick = () => {
    router.push(`/candidate/interviews/library/${interviewMode.name}`);
  };

  return (
    <>
      <Card
        key={interviewMode.name}
        className="border rounded-lg p-4 shadow-sm text-center max-w-96"
      >
        <CardTitle className="text-xl font-semibold">
          {interviewModeNameDisplay}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          <span>{interviewDescription}</span>
        </CardDescription>
        <Button className="mt-4" onClick={handleClick}>
          Show {interviewModeNameDisplay} Templates
        </Button>
      </Card>
    </>
  );
};
