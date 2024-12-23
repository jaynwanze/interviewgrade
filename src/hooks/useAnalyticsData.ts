import {
  getInterviewAnalytics,
  getLatestInterviewCompleted,
  getTotalCompletedInterviews,
} from '@/data/user/interviews';
import { Interview } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';
export const useAnalyticsData = () => {
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    completedInterviews: Interview[] | null;
    latestInterview: Interview | null;
  }>({
    completedInterviews: [],
    latestInterview: null,
  });

  // Fetch Overview Data
  const fetchOverviewData = async () => {
    try {
      setLoadingOverview(true);
      setError(null);

      const user = await serverGetLoggedInUser();
      if (!user || !user.id) {
        console.error('User not found');
        return;
      }
      setUserId(user.id);

      const completedInterviews = await getTotalCompletedInterviews(user.id);
      const latestInterview = await getLatestInterviewCompleted(user.id);

      setOverview({
        completedInterviews,
        latestInterview,
      });
      setLoadingOverview(false);
    } catch (err) {
      setLoadingOverview(false);
      setError('Failed to fetch overview analytics data.');
      console.error('Error fetching overview data:', err);
    }
  };

  // Fetch Detailed Data
  const fetchDetailedData = async (currentTemplateId: string) => {
    const templateId = currentTemplateId;
    if (!templateId || !userId) {
      setError('Template ID or User ID not found.');
      console.error('Template ID or User ID not found.');
      setLoadingDetailed(false);
      return null;
    }

    try {
      setLoadingDetailed(true);
      setError(null);
      const analytics = await getInterviewAnalytics(userId, templateId);
      if (!analytics) {
        setError('Failed to fetch detailed analytics data.');
        console.error('Failed to fetch detailed analytics data.');
        setLoadingDetailed(false);
        return null;
      }
      setLoadingDetailed(false);
      return analytics;
    } catch (err) {
      setLoadingDetailed(false);
      setError('Failed to fetch detailed analytics data.');
      console.error('Error fetching detailed analytics:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return {
    loadingOverview,
    loadingDetailed,
    error,
    overview,
    fetchOverviewData,
    fetchDetailedData,
  };
};
