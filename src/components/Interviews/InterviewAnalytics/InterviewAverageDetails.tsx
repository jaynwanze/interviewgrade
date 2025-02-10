'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InterviewAnalytics } from '@/types';
import { InterviewCurrentAverageKeyMetrics } from './InterviewCurrentAverageKeyMetrics';
import { InterviewInfo } from './InterviewInfo';
import { Trophy, Award, ClipboardList, Star } from 'lucide-react';

export const InterviewAverageDetails = ({
  analyticsData,
}: {
  analyticsData: InterviewAnalytics;
}) => {
  return (
    <>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5 items-center">
        {/* Left Column - Interview Info + Overall Score */}
        <div className="flex flex-col space-y-5">
          <Card className="shadow-lg rounded-lg p-6 text-center">
            <InterviewInfo
              title={analyticsData.interview_title || 'Deleted interview template'}
              description={analyticsData.interview_description || 'No description available.'}
            />
          </Card>

          {/* Overall Grade + Best Skill Badge */}
          <Card className="shadow-lg rounded-lg text-center flex flex-col items-center p-6">
            <CardHeader className="flex flex-col items-center">
              <Trophy className="w-10 h-10 text-yellow-500" />
              <CardTitle className="mt-2">Current Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{analyticsData.avg_overall_grade.toFixed(2)}%</p>
              <Badge variant="outline" className="mt-2 text-sm">
                {analyticsData.best_skill ? `Best Skill: ${analyticsData.best_skill}` : 'No Data'}
              </Badge>
              <p className="text-gray-500 mt-2">Performance averaged over all sessions.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sessions + Question Score */}
        <div className="flex flex-col space-y-5">
          {/* Total Sessions Count */}
          <Card className="shadow-lg rounded-lg text-center flex flex-col items-center p-6">
            <CardHeader className="flex flex-col items-center">
              <ClipboardList className="w-10 h-10 text-blue-500" />
              <CardTitle className="mt-2">Total Completed Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{analyticsData.total_interviews || 0}</p>
              <p className="text-gray-500">Total completed interview sessions.</p>
            </CardContent>
          </Card>

          {/* Average Mark Per Question */}
          <Card className="shadow-lg rounded-lg text-center flex flex-col items-center p-6">
            <CardHeader className="flex flex-col items-center">
              <Star className="w-10 h-10 text-purple-500" />
              <CardTitle className="mt-2">Average Score Per Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">
                {(
                  analyticsData.avg_overall_grade / analyticsData.question_count
                ).toFixed(2)}
                /{Math.floor(100 / analyticsData.question_count)}
              </p>
              <p className="text-gray-500">Marks scored per question on average.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evaluation Criteria Key Metrics */}
      <InterviewCurrentAverageKeyMetrics
        totalInterviews={analyticsData.total_interviews}
        avgOverallScore={analyticsData.avg_overall_grade}
        avgEvaluationCriteria={analyticsData.avg_evaluation_criteria_scores}
      />
    </>
  );
};
