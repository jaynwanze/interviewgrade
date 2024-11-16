'use client';

import { InterviewAnalyticsGrid } from '@/components/Interviews/InterviewAnalytics/InterviewAnalyticsGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InterviewAnalytics } from '@/types';
import { useState } from 'react';
import { InterviewGraphsDetailed } from './_graphs/_detailed/InterviewGraphsDetailed';
import { InterviewGraphsOverview } from './_graphs/_overview/InterviewGraphsOverview';

const mockAnalyticsData: InterviewAnalytics[] = [
  {
    id: 'a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14',
    candidate_id: 'c1d2e3f4-g5h6-i7j8-k9l10-m11n12o13p14',
    template_id: 't1u2v3w4-x5y6-z7a8-b9c10-d11e12f13g14',
    interview_title: 'Senior Software Engineer Interview',
    interview_description:
      'Interview for the Senior Software Engineer position focusing on system design and algorithms.',
    period_start: '2023-01-01',
    period_end: '2023-01-31',
    total_interviews: 25,
    avg_overall_score: 85.75,
    avg_evaluation_criteria_scores: [
      {
        id: 'c1d2e3f4-g5h6-i7j8-k9l10-m11n12o13p14',
        name: 'Technical Knowledge',
        avg_score: 9.5,
        feedback_summary: [
          'Strong understanding of data structures.',
          'Excellent grasp of system design principles.',
        ],
      },
      {
        id: 'q1r2s3t4-u5v6-w7x8-y9z10-a11b12c13d14',
        name: 'Problem Solving',
        avg_score: 8.3,
        feedback_summary: [
          'Good problem-solving skills but can improve efficiency.',
          'Approaches problems methodically.',
        ],
      },
      {
        id: 'e1f2g3h4-i5j6-k7l8-m9n10-o11p12q13r14',
        name: 'Communication',
        avg_score: 7.2,
        feedback_summary: [
          'Clear and concise communication.',
          'Effectively explains complex concepts.',
        ],
      },
    ],
    strengths_summary: [
      'Excellent technical knowledge.',
      'Strong system design skills.',
      'Effective communicator.',
    ],
    areas_for_improvement_summary: [
      'Improve problem-solving speed.',
      'Enhance coding efficiency.',
    ],
    recommendations_summary: [
      'Provide more real-world system design examples.',
      'Practice solving problems under time constraints.',
    ],
    created_at: '2023-02-05T10:15:30Z',
    updated_at: '2023-02-10T14:22:45Z',
  },
];

export default function InterviewAnalyticsPage() {
  const [analyticsData, setAnalyticsData] =
    useState<InterviewAnalytics[]>(mockAnalyticsData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-6">
      <Card className=" mb-6 text-center ">
        <CardHeader className="text-3xl font-bold text-center">
          <CardTitle>Interview Analytics Dashboard</CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <Tabs defaultValue="overview">
          {/* Tab List */}
          <TabsList className="grid grid-cols-2 w-full mx-auto mb-5">
            <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analytics</TabsTrigger>
          </TabsList>
          {/* Dashboard Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Interviews Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Interview Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center">
                    {analyticsData[0].total_interviews}
                  </p>
                  will show total interviews every 5 seconds of diff interview
                </CardContent>
              </Card>

              {/* Average Overall Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Average Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center">
                    {' '}
                    {analyticsData[0].avg_overall_score.toFixed(2)} / 100{' '}
                  </p>
                  will display average overall score every 5 seconds of diff
                  interview
                </CardContent>
              </Card>

              {/* Strengths and Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle>Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  Will shuffle through strengths,weeaknesses and recommendations
                  and display one at a time for 5 seconds
                  <ul className="list-disc list-inside">
                    {analyticsData[0].strengths_summary.map(
                      (strength, index) => (
                        <li key={index} className="text-sm">
                          {strength}
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <Separator className="my-8" />
            <InterviewGraphsOverview analyticsData={analyticsData} />
          </TabsContent>

          {/* Detailed Analytics Tab */}
          <TabsContent value="details">
            <div className="flex justify-center mb-5">
              <span className=" text-xl font-medium me-2 px-2.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                Current Averages & Summaries
              </span>
            </div>
            <InterviewAnalyticsGrid analyticsData={analyticsData} />
            <div className="flex justify-center mb-5">
              <span className=" flex justify-center text-xl font-medium me-2 px-2.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                Progression Over Time
              </span>
            </div>
            <InterviewGraphsDetailed analyticsData={analyticsData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
