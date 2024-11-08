'use client';

import { AvgEvaluationScores } from '@/types';
import { useEffect, useState } from 'react';

const getRandomItem = (arr: string[]): string => {
  if (arr.length === 0) return 'No data available.';
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

export const InterviewKeyMetrics = ({
  totalInterviews,
  avgOverallScore,
  avgEvaluationCriteria,
}: {
  totalInterviews: number;
  avgOverallScore: number;
  avgEvaluationCriteria: AvgEvaluationScores[];
}) => {
  const [randomFeedbacks, setRandomFeedbacks] = useState<string[]>(
    avgEvaluationCriteria.map((criteria) =>
      getRandomItem(criteria.feedback_summary),
    ),
  );

  useEffect(() => {
    const intervals = avgEvaluationCriteria.map((criteria, index) => {
      return setInterval(() => {
        setRandomFeedbacks((prevFeedbacks) => {
          const newFeedbacks = [...prevFeedbacks];
          newFeedbacks[index] = getRandomItem(criteria.feedback_summary);
          return newFeedbacks;
        });
      }, 5000); // 5000 milliseconds = 5 seconds
    });

    // Cleanup intervals on component unmount
    return () => intervals.forEach(clearInterval);
  }, [avgEvaluationCriteria]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Interviews */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
        <h4 className="text-sm text-gray-500 dark:text-gray-300">
          Total Interviews
        </h4>
        <p className="text-2xl font-bold">{totalInterviews}</p>
      </div>

      {/* Average Overall Score */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
        <h4 className="text-sm text-gray-500 dark:text-gray-300">
          Average Overall Score
        </h4>
        <p className="text-2xl font-bold ">
          {avgOverallScore.toFixed(2)} / 100
        </p>
      </div>

      {/* Average Evaluation Criteria Scores */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
        <h4 className="text-sm text-gray-500 dark:text-gray-300">
          Average Evaluation Criteria Scores
        </h4>
        <ul className="space-y-2">
          {avgEvaluationCriteria.map((criteria, index) => (
            <li key={criteria.id}>
              <strong>{criteria.name}</strong>: {criteria.avg_score.toFixed(2)}{' '}
              / 10
              <strong> Feedback: {randomFeedbacks[index]} </strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
