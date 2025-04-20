'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InterviewAnalytics } from '@/types';

const EvaluationCriteriaBar = ({
  name,
  score,
}: {
  name: string;
  score: number;
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Criterion Name */}
      <div className="w-1/3 text-sm font-medium text-gray-700">{name}</div>
      {/* Horizontal bar background */}
      <div className="w-1/2 bg-gray-200 rounded h-2 mx-2">
        {/* Filled portion representing the score */}
        <div
          className="bg-green-500 h-2 rounded"
          style={{ width: `${score}%` }}
        />
      </div>
      {/* Display numeric score */}
      <div className="w-1/6 text-sm font-semibold text-gray-800">{score}%</div>
    </div>
  );
};

export const TemplateOverview = ({
  analyticsData,
}: {
  analyticsData: InterviewAnalytics;
}) => {
  return (
    <div className="space-y-1 h-full">
      <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg p-2 transform transition hover:scale-105">
        <CardContent>
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {analyticsData.interview_title || 'Deleted Template'}
          </h3>
          <Separator className="my-2" />

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Evaluates candidates based on the following sub-skill areas:
          </p>
          {analyticsData.avg_evaluation_criteria_scores.length > 0 ? (
            <ul className="list-disc pl-5 mt-2  text-gray-600 dark:text-gray-300 text-sm">
              {analyticsData.avg_evaluation_criteria_scores.map(
                (criteria, index) => (
                  <li key={index} className="mb-1 font-bold">
                    {criteria.name}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
              No evaluation criteria are currently available for this template.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
