'use client';

import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Interview } from '@/types';
import { InterviewInfo } from './InterviewInfo';

export const InterviewLatestCard = ({
  latestInterview,
}: {
  latestInterview?: Interview | null;
}) => {
  if (!latestInterview) {
    return (
      <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg p-2 text-center transform transition hover:scale-105">
        <p className="text-gray-500 text-lg">
          No latest interview data available.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg p-2 transform transition hover:scale-105">
      <CardContent>
        <InterviewInfo
          interviewId={latestInterview.id}
          title={latestInterview.title || 'Deleted interview template'}
          description={
            latestInterview.description || 'No description available.'
          }
          startDate={latestInterview.start_time}
          endDate={latestInterview.end_time}
        />
      </CardContent>
    </Card>
  );
};
