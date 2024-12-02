'use client';

import { InterviewAnalyticsGrid } from '@/components/Interviews/InterviewAnalytics/InterviewAnalyticsGrid';
import { InterviewLatestCard } from '@/components/Interviews/InterviewAnalytics/InterviewLatestCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { InterviewGraphsDetailed } from './_graphs/_detailed/InterviewGraphsDetailed';
import { InterviewGraphsOverview } from './_graphs/_overview/InterviewGraphsOverview';

export default function InterviewAnalyticsPage() {
  const {
    loading,
    error,
    overview,
    detailed,
    noDetailedData,
    fetchDetailedData,
  } = useAnalyticsData({});

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">
        <Card>
          <CardHeader>
            <CardTitle>Interview Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-center">
              {overview?.completedInterviews?.length || 0}
            </p>
            <p>Total completed interviews.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-center">
              {/* Replace with real calculation */}
              N/A
            </p>
            <p>Average score for completed interviews.</p>
          </CardContent>
        </Card>
      </div>
      <InterviewLatestCard latestInterview={overview?.latestInterview} />
      <InterviewGraphsOverview
        interviewsCompleted={overview?.completedInterviews || []}
      />
    </>
  );

  const renderDetailed = () => {
    if (!detailed || noDetailedData) {
      return (
        <p className="text-center text-gray-500">
          No detailed analytics available.
        </p>
      );
    }
    return (
      <>
        <InterviewAnalyticsGrid analyticsData={detailed} />
        <InterviewGraphsDetailed analyticsData={detailed} />
      </>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6 text-center">
        <CardHeader className="text-3xl font-bold text-center">
          <CardTitle>Interview Analytics Dashboard</CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 w-full mx-auto mb-5">
            <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="details">{renderDetailed()}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
