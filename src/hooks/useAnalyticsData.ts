import {
  SentimentScore,
  fetchSentiment,
} from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';
import {
  getInterviewAnalytics,
  getTotalCompletedInterviews
} from '@/data/user/interviews';
import { Interview, InterviewAnalytics } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';
export const useAnalyticsData = () => {
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    completedInterviews: Interview[] | null;
    interviewAnalytics: InterviewAnalytics[] | null;
  }>({
    completedInterviews: [],
    interviewAnalytics: [],
  });
  const [currentSentimentDetailed, setCurrentSentimentDetailed] =
    useState<SentimentScore | null>(null);

  // Fetch Overview Data
  const fetchOverviewData = async (mode: string) => {
    try {
      setLoadingOverview(true);
      setError(null);

      const user = await serverGetLoggedInUser();
      if (!user || !user.id) {
        console.error('User not found');
        return;
      }
      setUserId(user.id);

      // Fetch all completed interviews
      const completedInterviews = await getTotalCompletedInterviews(user.id);
      if (!completedInterviews || completedInterviews.length === 0) {
        setError('No completed interviews found.');
        console.error('No completed interviews found.');
        setLoadingOverview(false);
        return;
      }

      // Filter unique templates with at least one completed interview
      const uniqueTemplates = new Set<string>();
      const filteredTemplates = completedInterviews.filter((interview) => {
        if (uniqueTemplates.has(interview.template_id)) {
          return false;
        }
        uniqueTemplates.add(interview.template_id);
        return true;
      });

      // Fetch detailed analytics for each template
      const interviewAnalytics = (
        await Promise.all(
          filteredTemplates.map((interview) =>
            getInterviewAnalytics(user.id, interview.template_id, 'Practice Mode')
          )
        )
      ).filter((analytics): analytics is InterviewAnalytics => analytics !== null);

      if (!interviewAnalytics || interviewAnalytics.length === 0) {
        setError('Failed to fetch interview analytics data.');
        console.error('Failed to fetch interview analytics data.');
        setLoadingOverview(false);
        return;
      }

      // Update the overview state
      setOverview({
        completedInterviews,
        interviewAnalytics,
      });
      setLoadingOverview(false);
    } catch (err) {
      setLoadingOverview(false);
      setError('Failed to fetch overview analytics data.');
      console.error('Error fetching overview data:', err);
    }
  };

  // Fetch Detailed Data
  const fetchDetailedData = async (
    currentTemplateId: string,
    interviewMode: string,
  ) => {
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
      const analytics = await getInterviewAnalytics(
        userId,
        templateId,
        interviewMode,
      );
      if (!analytics) {
        setError('Failed to fetch detailed analytics data.');
        console.error('Failed to fetch detailed analytics data.');
        setLoadingDetailed(false);
        return null;
      }

      const allAnswers = analytics.completed_interview_evaluations.flatMap(
        (evaluation) =>
          evaluation.question_answer_feedback.map(
            (question) => question.answer,
          ),
      );

      const sentiment = await fetchSentiment(allAnswers);
      setCurrentSentimentDetailed(sentiment);
      setLoadingDetailed(false);
      return analytics;
    } catch (err) {
      setLoadingDetailed(false);
      setError('Failed to fetch detailed analytics data.');
      console.error('Error fetching detailed analytics:', err);
      return null;
    }
  };

  return {
    loadingOverview,
    loadingDetailed,
    error,
    overview,
    fetchOverviewData,
    fetchDetailedData,
    currentSentimentDetailed,
  };
};
