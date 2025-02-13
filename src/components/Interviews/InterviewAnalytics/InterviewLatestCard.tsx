'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Interview } from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import { InterviewInfo } from './InterviewInfo';

export const InterviewLatestCard = ({
  latestInterview,
}: {
  latestInterview?: Interview | null;
}) => {
  if (!latestInterview) {
    return (
      <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg p-2 text-center">
        <p className="text-gray-500 text-lg">No latest interview data available.</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg p-2">
        <CardTitle className="text-xl font-semibold">
          Latest {latestInterview.mode === INTERVIEW_PRACTICE_MODE ? 'Practice Session' : 'Mock Interview'}
        </CardTitle>
      <Separator className="my-2" />
      <CardContent>
        <InterviewInfo
          interviewId={latestInterview.id}
          title={latestInterview.title || 'Deleted interview template'}
          description={latestInterview.description || 'No description available.'}
          startDate={latestInterview.start_time}
          endDate={latestInterview.end_time}
        />
      </CardContent>
    </Card>
  );
};
