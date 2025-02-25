'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Interview, InterviewAnalytics } from '@/types';
import { ClipboardList, Star, Trophy } from 'lucide-react';
import { InterviewLatestCard } from './InterviewLatestCard';

export const InterviewAverageDetails = ({
  analyticsData,
  latestInterview,
}: {
  analyticsData: InterviewAnalytics;
  latestInterview: Interview;
}) => {
  return (
    <>
      {/* Key Metrics Grid */}
      <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5 items-center">
        {/* Left Column - Interview Info + Overall Score */}
        <InterviewLatestCard latestInterview={latestInterview} />
        {/* Overall Grade + Best Skill Badge */}
        <Card className="flex flex-col justify-center items-center h-full shadow-lg rounded-lg text-center p-6 ">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <CardTitle className="mt-2">Current Average Grade</CardTitle>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {analyticsData.avg_overall_grade.toFixed(2)}%
            </p>
            <Badge variant="outline" className="mt-2 text-sm">
              {analyticsData.best_evaluation_crieria
                ? `Best Skill: ${analyticsData.best_evaluation_crieria}`
                : 'No Data'}
            </Badge>
            {/* <p className="text-gray-500 mt-2">
              Performance averaged over all sessions.
            </p> */}
          </div>
        </Card>
        {/* Average Mark Per Question */}
        <Card className="flex flex-col md:col-span-2 lg:col-span-1 justify-center items-center h-full shadow-lg rounded-lg text-center p-6">
          <Star className="w-10 h-10 text-purple-500" />
          <CardTitle className="mt-2">Average Score Per Question</CardTitle>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {(
                analyticsData.avg_overall_grade / analyticsData.question_count
              ).toFixed(2)}
              /{Math.floor(100 / analyticsData.question_count)}
            </p>
            <p className="text-gray-500">
              Marks scored per question on average.
            </p>
          </div>
        </Card>
      </div>

      {/* Evaluation Criteria Key Metrics
      <InterviewCurrentAverageKeyMetrics
        totalInterviews={analyticsData.total_interviews}
        avgOverallScore={analyticsData.avg_overall_grade}
        avgEvaluationCriteria={analyticsData.avg_evaluation_criteria_scores}
      /> */}
    </>
  );
};
