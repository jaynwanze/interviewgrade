'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Interview, InterviewAnalytics } from '@/types';
import { getBadgeColor } from '@/utils/getBadgeColour';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { ClipboardList, Star, Trophy } from 'lucide-react';
import { TemplateOverview } from './TemplateOverview';

export const InterviewAverageDetails = ({
  analyticsData,
  latestInterview,
}: {
  analyticsData: InterviewAnalytics;
  latestInterview: Interview;
}) => {
  const gridsColsSpanNum = analyticsData.interview_template_id ? 4 : 3;
  return (
    <>
      {/* Key Metrics Grid */}
      <div
        className={`grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridsColsSpanNum} gap-6 mb-5 items-center`}
      >
        {/* Template over view */}
        <TemplateOverview analyticsData={analyticsData} />
        {/* Overall Grade + Best sub Skill Badge */}
        <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg text-center p-6 transform transition hover:scale-105">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <CardTitle className="mt-2">Current Grade Average</CardTitle>
          <div className="flex flex-col items-center">
            <p
              className={`text-2xl mt-2 font-bold px-2 py-1 rounded-lg shadow-md ${getBadgeColor(
                Math.min(Math.round(analyticsData.avg_overall_grade))
              )}`}
            >
              {Math.min(Math.round(analyticsData.avg_overall_grade))}%
            </p>
            <span className="font-semibold mt-2">Best Sub-Skill:</span>{' '}
            <Badge
              variant="outline"
              className="mt-1 text-sm px-3 py-1 rounded-full bg-gradient-to-r from-green-400 via-green-300 to-green-200 text-green-900 shadow-md"
            >
              {analyticsData.best_evaluation_crieria ? (
                <>
                  {analyticsData.best_evaluation_crieria}
                </>
              ) : (
                'No Data Available'
              )}
            </Badge>
            {/* <p className="text-gray-500 mt-2">
              Performance averaged over all sessions.
            </p> */}
          </div>
        </Card >
        {/* Average Mark Per Question */}
        {
          analyticsData.interview_template_id && (
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
          )
        }
        <Card className="flex flex-col md:col-span-2 lg:col-span-1 justify-center items-center h-full shadow-lg rounded-lg text-center p-6 transform transition hover:scale-105">
          {/* Total Sessions Count */}
          <ClipboardList className="w-10 h-10 text-blue-500" />
          <CardTitle className="mt-2">Total Completed Sessions</CardTitle>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {analyticsData.total_interviews || 0}
            </p>
            <a
              href={`/candidate/interview-history/${latestInterview.id}`}
              className="inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline transition p-1"
            >
              <MagnifyingGlassIcon className="inline w-4 h-4 mr-1" />
              View latest session history
            </a>
          </div>
        </Card>
      </div >
    </>
  );
};
