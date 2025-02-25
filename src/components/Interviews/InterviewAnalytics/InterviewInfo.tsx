'use client';

import { Separator } from '@/components/ui/separator';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

export const InterviewInfo = ({
  interviewId,
  title,
  description,
  startDate,
  endDate,
}: {
  interviewId?: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
}) => {
  // Format Dates & Times Properly
  const formatDate = (date?: string) =>
    date
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(date))
      : 'N/A';

  return (
    <div className="space-y-1">
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {title || 'Deleted Template'}
      </h3>
      <Separator className="my-2" />

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {description || 'No description available.'}
      </p>

      {/* Start & End Date */}
      {startDate && endDate && (
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Start:</strong> {formatDate(startDate)}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>End:</strong> {formatDate(endDate)}
          </p>
        </div>
      )}

      {/* View Session History Link */}
      {interviewId && (
        <a
          href={`/candidate/interview-history/${interviewId}`}
          className="inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
        >
          <MagnifyingGlassIcon className="inline w-4 h-4 mr-1" />
          View latest session history
        </a>
      )}
    </div>
  );
};
