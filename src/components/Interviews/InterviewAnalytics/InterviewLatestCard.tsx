'use client';
import { Card } from '@/components/ui/card';
import { getLatestInterviewCompleted } from '@/data/user/interviews';
import { Interview } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';
import { InterviewInfo } from './InterviewInfo';

export const InterviewLatestCard = ({ data }: { data: Interview }) => {
  const [latestInterviewCompleted, setLatestInterviewCompleted] =
    useState<Interview>();

  const fetchLatestInterviewCompleted = async () => {
    try {
      const user = await serverGetLoggedInUser();
      const data = await getLatestInterviewCompleted(user.id);
      if (!data) {
        return;
      }
      setLatestInterviewCompleted(data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  };

  useEffect(() => {
    fetchLatestInterviewCompleted();
  }, []);

  if (latestInterviewCompleted) {
    data = latestInterviewCompleted;
  }

  if (!data) {
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
          title={data.title ? data.title : 'Deleted interview template'}
          description={
            data.description ? data.description : 'No description available.'
          }
          startDate={data.start_time}
          endDate={data.end_time}
        />
      </div>
    </Card>
  );
};
