'use client';

export const InterviewInfo = ({
  title,
  description,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
}) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
        {title || 'Deleted Template'}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description || 'No description available.'}
      </p>
      {startDate && endDate && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start Time/Date:{new Date(startDate).toLocaleTimeString()} - {new Date(startDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            End Time/Date: {new Date(endDate).toLocaleTimeString()} - {new Date(endDate).toLocaleDateString() }
          </p>
        </>
      )}
      <a href="#" className="text-blue-500 dark:text-blue-400 hover:underline">
        View session history
      </a>
    </div>
  );
};
