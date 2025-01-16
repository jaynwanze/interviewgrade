'use client';

import { Interview } from '@/types';
import { InterviewHistoryItem } from './InterviewHistoryItem';

export const InterviewHistoryList = ({
  interviews,
  interviewModeToggle,
}: {
  interviews: Interview[];
  interviewModeToggle: string;
}) => {
  const interviewModeDisplayString = interviewModeToggle === 'Interview Mode'? 'interviews' : 'practice sessions' ;
  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-screen-md space-y-4">
        {interviews.length > 0 ? (
          interviews.map((interview) => (
            <InterviewHistoryItem key={interview.id} interview={interview} />
          ))
        ) : (
          <div className="w-full max-w-screen-md  border rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-900 transition duration-200">
            <h3 className="text-xl font-semibold">No {interviewModeDisplayString} found</h3>
            <p className="text-gray-600">
              <div>No {interviewModeDisplayString} found for this filter.</div>
              <div className="text-gray-600">Please check back later.</div>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
