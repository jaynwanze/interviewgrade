'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import type { LegacyDetailedAnalytics } from '@/modules/analytics/legacy-detailed-analytics';
import { Interview } from '@/types';
import { getBadgeColor } from '@/utils/getBadgeColour';
import { ClipboardList, Star, Trophy } from 'lucide-react';
import { TemplateOverview } from './TemplateOverview';

export const InterviewAverageDetails = ({
  analyticsData,
  latestInterview,
}: {
  analyticsData: LegacyDetailedAnalytics;
  latestInterview: Interview;
}) => {
  const gridsColsSpanNum = analyticsData.interview_template_id ? 4 : 3;
  return (
    <>
      <div
        className={`grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridsColsSpanNum} gap-6 mb-5 items-center`}
      >
        <TemplateOverview analyticsData={analyticsData} />
        <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg text-center p-6 transform transition hover:scale-105">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <CardTitle className="mt-2">Current Grade Average</CardTitle>
          <div className="flex flex-col items-center">
            <p
              className={`text-2xl mt-2 font-bold px-2 py-1 rounded-lg shadow-md ${getBadgeColor(
                Math.min(Math.round(analyticsData.avg_overall_grade)),
              )}`}
            >
              {Math.min(Math.round(analyticsData.avg_overall_grade))}%
            </p>
            <span className="font-semibold mt-2">Best Sub-Skill:</span>{' '}
            <Badge
              variant="outline"
              className="mt-1 text-sm px-3 py-1 rounded-full bg-gradient-to-r from-green-400 via-green-300 to-green-200 text-green-900 shadow-md"
            >
              {analyticsData.best_evaluation_crieria || 'No Data Available'}
            </Badge>
          </div>
        </Card>
        {analyticsData.interview_template_id && (
          <Card className="flex flex-col md:col-span-2 lg:col-span-1 justify-center items-center h-full shadow-lg rounded-lg text-center p-6 transform transition hover:scale-105">
            <Star className="w-10 h-10 text-purple-500" />
            <CardTitle className="mt-2">Average Score Per Question</CardTitle>
            <div>
              <p className="text-4xl font-bold text-gray-900">
                {(
                  analyticsData.avg_overall_grade / analyticsData.question_count
                ).toFixed(0)}
                /{Math.floor(100 / analyticsData.question_count)}
              </p>
              <p className="text-gray-500">
                Marks scored per question on average.
              </p>
            </div>
          </Card>
        )}
        <Card className="flex flex-col md:col-span-2 lg:col-span-1 justify-center items-center h-full shadow-lg rounded-lg text-center p-6 transform transition hover:scale-105">
          <ClipboardList className="w-10 h-10 text-blue-500" />
          <CardTitle className="mt-2">Total Completed Sessions</CardTitle>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {analyticsData.total_interviews || 0}
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};
