import {
  SentimentScore,
  fetchSentiment,
} from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';
import {
  getInterviewAnalytics,
  getTotalCompletedInterviews,
} from '@/data/user/interviews';
import { Interview, InterviewAnalytics } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useState } from 'react';
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

      // Filter interviews based on the selected mode
      const filteredInterviews = completedInterviews.filter((interview) => {
        if (mode === 'Practice Mode') {
          return interview.template_id !== null; // Only include practice interviews
        } else if (mode === 'Interview Mode') {
          return interview.interview_template_id !== null; // Only include real interviews
        }
        return false;
      });

      // Filter unique templates with at least one completed interview
      const uniqueTemplates = new Set<string>();
      const filteredTemplates = filteredInterviews.filter((interview) => {
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
            getInterviewAnalytics(user.id, interview.template_id, mode),
          ),
        )
      ).filter(
        (analytics): analytics is InterviewAnalytics => analytics !== null,
      );

      if (!interviewAnalytics || interviewAnalytics.length === 0) {
        setError('Failed to fetch interview analytics data.');
        console.error('Failed to fetch interview analytics data.');
        setLoadingOverview(false);
        return;
      }

      // Update the overview state
      setOverview({
        completedInterviews: filteredInterviews,
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
    try {
      setLoadingDetailed(true);
      setError(null);

      const user = await serverGetLoggedInUser();
      if (!user || !user.id) {
        console.error('User not found');
        setError('User not found.');
        setLoadingDetailed(false);
        return null;
      }

      const templateId = currentTemplateId;
      if (!templateId) {
        setError('Template ID not found.');
        console.error('Template ID not found.');
        setLoadingDetailed(false);
        return null;
      }

      setUserId(user.id);

      const analytics = await getInterviewAnalytics(
        user.id,
        templateId,
        interviewMode,
      );
      if (!analytics) {
        setError('No detailed analytics returned.');
        console.error('No detailed analytics returned.');
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
      console.error('Error fetching detailed analytics:', err);
      setError('Failed to fetch detailed analytics data.');
      setLoadingDetailed(false);
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
