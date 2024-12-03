'use client';
import { Card } from '@/components/ui/card';
import { Interview } from '@/types';
import { InterviewInfo } from './InterviewInfo';

export const InterviewLatestCard = ({
  latestInterview,
}: {
  latestInterview?: Interview | null;
}) => {
  if (!latestInterview) {
    return (
      <Card className="shadow rounded-lg p-6 flex flex-col space-y-4 mb-5">
        <p className="text-center">
          No latest interview data available at this time.
        </p>
      </Card>
    );
  }

  return (
    <Card className="shadow rounded-lg p-6 flex flex-col space-y-4 mb-5">
      <div className="text-center">
        <InterviewInfo
          title={
            latestInterview.title
              ? latestInterview.title
              : 'Deleted interview template'
          }
          description={
            latestInterview.description
              ? latestInterview.description
              : 'No description available.'
          }
          startDate={latestInterview.start_time}
          endDate={latestInterview.end_time}
        />
      </div>
    </Card>
  );
};
