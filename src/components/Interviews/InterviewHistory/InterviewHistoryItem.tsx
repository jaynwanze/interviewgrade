'use client';

import { Button } from '@/components/ui/button';
import { Interview } from '@/types';
import { useRouter } from 'next/navigation';
export const InterviewHistoryItem = ({
  interview,
}: {
  interview: Interview;
}) => {
  const router = useRouter();
  const handleViewDetailsClick = () => {
    router.push(`/candidate/interview-history/${interview.id}`);
  };

  const handleFinishSessionClick = () => {
    router.push(`/candidate/interviews/session/${interview.id}`);
  };

  const displayStatus: string =
    interview.status === 'completed'
      ? 'Completed'
      : interview.status === 'in_progress'
        ? 'Not Completed'
        : interview.status === 'not_started'
          ? 'Not Started'
          : 'Unknown';
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-900 transition duration-200">
      <h3 className="text-xl font-semibold">{interview.title}</h3>
      <p className="text-gray-600">Status: {displayStatus}</p>
      <p className="text-gray-600">
        Started At:{' '}
        {interview.start_time
          ? new Date(interview.start_time).toLocaleString()
          : 'N/A'}
      </p>
      <p className="text-gray-600">
        Completed At:{' '}
        {interview.end_time
          ? new Date(interview.end_time).toLocaleString()
          : 'N/A'}
      </p>
      {interview.status === 'completed' ? (
        <Button
          className="mt-2 inline-block"
          onClick={() => handleViewDetailsClick()}
        >
          View Details
        </Button>
      ) : (
        <Button
          className="mt-2 inline-block"
          onClick={() => handleFinishSessionClick()}
        >
          Finish Session
        </Button>
      )}
    </div>
  );
};
