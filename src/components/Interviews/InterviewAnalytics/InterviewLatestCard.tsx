'use client';
import { Card, CardTitle } from '@/components/ui/card';
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
      <Card className="shadow rounded-lg p-6 flex flex-col space-y-4 mb-5">
        <p className="text-center">
          No latest interview data available at this time.
        </p>
      </Card>
    );
  }

  return (
    <div className="text-center">
      <Card className="shadow rounded-lg p-6 flex flex-col space-y-4 mb-5">
        <CardTitle className="text-3xl">
          Latest{' '}
          {latestInterview.mode === INTERVIEW_PRACTICE_MODE
            ? 'Practice Session'
            : 'Mock Interview'}{' '}
        </CardTitle>
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
      </Card>
    </div>
  );
};
