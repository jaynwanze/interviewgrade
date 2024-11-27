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
  const [state, setState] = useState({
    loading: true,
    error: null as string | null,
    userId: null as string | null,
    overview: {
      completedInterviews: [] as Interview[] | [],
      latestInterview: null as Interview | null,
    },
    detailed: null as InterviewAnalytics | null,
    noDetailedData: false,
  });

  const fetchOverviewData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch logged-in user ID
      const user = await serverGetLoggedInUser();
      const userId = user.id;
      setState((prev) => ({ ...prev, userId }));

      // Fetch overview data
      const completedInterviews = await getTotalCompletedInterviews(userId);
      const latestInterview = await getLatestInterviewCompleted(userId);
      console.log('completedInterviews:', completedInterviews);
      console.log('latestInterview:', latestInterview);

      setState((prev) => ({
        ...prev,
        overview: {
          completedInterviews: completedInterviews,
          latestInterview: latestInterview,
        },
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch overview analytics data.',
      }));
      console.error('Error fetching overview data:', error);
    }
  };

  const fetchDetailedData = async () => {
    const templateId =
      currentTemplateId || state.overview.latestInterview?.template_id;

    if (!templateId || !state.userId) {
      setState((prev) => ({ ...prev, noDetailedData: true }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const analytics = await getInterviewAnalytics(state.userId, templateId);

      setState((prev) => ({
        ...prev,
        detailed: analytics,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch detailed analytics data.',
      }));
      console.error('Error fetching detailed analytics:', error);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (state.userId) {
      fetchDetailedData();
    }
  }, [currentTemplateId, state.userId, state.overview.latestInterview]);

  return { ...state, fetchOverviewData, fetchDetailedData };
};
