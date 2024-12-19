import {
  getInterviewAnalytics,
  getLatestInterviewCompleted,
  getTotalCompletedInterviews,
} from '@/data/user/interviews';
import { Interview, InterviewAnalytics } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';
export const useAnalyticsData = ({
  currentTemplateId,
}: {
  currentTemplateId?: string;
}) => {
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
  const [detailed, setDetailed] = useState<InterviewAnalytics | null>(null);
  const [noDetailedData, setNoDetailedData] = useState(false);

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
  const fetchDetailedData = async () => {
    const templateId =
      currentTemplateId || overview.latestInterview?.template_id;

    if (!templateId || !userId) {
      setNoDetailedData(true);
      return;
    }

    try {
      setLoadingDetailed(true);
      setError(null);
      const analytics = await getInterviewAnalytics(userId, templateId);
      setDetailed(analytics);
      setLoadingDetailed(false);
    } catch (err) {
      setLoadingDetailed(false);
      setError('Failed to fetch detailed analytics data.');
      console.error('Error fetching detailed analytics:', err);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchDetailedData();
    }
  }, [currentTemplateId, userId, overview.latestInterview]);

  return {
    loadingOverview,
    loadingDetailed,
    error,
    overview,
    detailed,
    fetchOverviewData,
    fetchDetailedData,
  };
};
