'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterviewMode } from '@/types';
import {
  INTERVIEW_INTERVIEW_MODE,
  INTERVIEW_MODE_INTERVIEW_DESCRIPTION,
  INTERVIEW_MODE_PRACTICE_DESCRIPTION,
} from '@/utils/constants';
import { ArrowRightIcon, BookOpen, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../ui/button';

export const InterviewModeCard = (interviewMode: InterviewMode) => {
  const interviewModeNameDisplay: string =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE
      ? 'Mock Interview'
      : 'Practice Mode';

  const interviewDescription: string =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE
      ? INTERVIEW_MODE_INTERVIEW_DESCRIPTION
      : INTERVIEW_MODE_PRACTICE_DESCRIPTION;

  const router = useRouter();

  const handleClick = () => {
    router.push(`/candidate/interviews/library/${interviewMode.name}`);
  };

  // Determine badge color and icon based on mode
  const modeBadge =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE
      ? 'bg-blue-500 text-white'
      : 'bg-green-500 text-white';

  const modeButton =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE
      ? 'border-blue-600 text-blue-600 hover:bg-blue-500'
      : 'border-green-600 text-green-600 hover:bg-green-500';

  const modeIcon =
    interviewMode.name === INTERVIEW_INTERVIEW_MODE ? (
      <Briefcase className="w-6 h-6" />
    ) : (
      <BookOpen className="w-6 h-6" />
    );

  return (
    <>
      <Card
        key={interviewMode.name}
        className="border rounded-lg shadow-lg hover:shadow-xl transition duration-200 text-center max-w-80"
      >
        <CardHeader className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            {modeIcon}
            <CardTitle className="text-lg font-semibold">
              {interviewModeNameDisplay}
            </CardTitle>
          </div>
          <Badge className={`mt-2 px-3 py-1 text-sm ${modeBadge}`}>
            {interviewModeNameDisplay}
          </Badge>
        </CardHeader>

        <CardContent className="text-gray-600 space-y-3">
          <p className="text-sm">{interviewDescription}</p>
          <Button
            variant="link"
            size="sm"
            onClick={handleClick}
            className={`w-full mt-2 flex items-center justify-center border ${modeButton} hover:text-white transition-colors duration-200`}
          >
            {interviewModeNameDisplay} Templates
            <ArrowRightIcon className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
