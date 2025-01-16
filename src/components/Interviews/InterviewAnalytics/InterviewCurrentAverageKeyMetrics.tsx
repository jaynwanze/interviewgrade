'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { AvgEvaluationScores } from '@/types';
import { useEffect, useState } from 'react';
import { RadialChart } from './RadialChart';

const getRandomItem = (arr: string[]): string => {
  if (arr.length === 0) return 'No data available.';
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

export const InterviewCurrentAverageKeyMetrics = ({
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
    <div className="grid grid-cols-1 gap-6 text-center mb-5">
      {/* Total Interviews , Avg overeall score and avg score per mark
      <Card className=" p-4 rounded">
        <h4 className="text-sm text-gray-500 dark:text-gray-300">
          Total Interviews
        </h4>
        <p className="text-2xl font-bold">{totalInterviews}</p>
        <h4 className="text-sm text-gray-500 dark:text-gray-300 text">
          Average Overall Grade
        </h4>
        <p className="text-2xl font-bold ">
          {avgOverallScore.toFixed(2)} / 100
        </p>
        <h4 className="text-sm text-gray-500 dark:text-gray-300 text">
          Average Mark Per Question
        </h4>
        <p className="text-2xl font-bold ">
          avg grade/ question.length / 100/ question.length
        </p>
      </Card> */}

      {/* Average Evaluation Criteria Scores */}
      <Card className=" p-4 rounded">
        <CardTitle className='mb-5'>
          Current Average Evaluation Criteria Scores (Out of 10)
        </CardTitle>
        <div className="grid grid-cols-3 gap-1 text-ellipsis text-wrap">
          {avgEvaluationCriteria.map((criteria, index) => (
            <div key={index}>
              <div className="mb">
                <RadialChart avgEvaluationCriteria={[criteria]} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Average Evaluation Criteria Scores */}
      {/* <Card className="p-4 rounded">
        <h4 className="text-sm text-gray-500 dark:text-gray-300">
          Evaluation Criteria Feedback Summaries
        </h4>
        <ul className="space-y-2">
          {avgEvaluationCriteria.map((criteria, index) => (
            <li key={criteria.id}>
              <strong>{criteria.name} Feedback:</strong>
              <p> {randomFeedbacks[index]} </p>
            </li>
          ))}
        </ul>
      </Card> */}
    </div>
  );
};
