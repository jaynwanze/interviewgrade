import {
  SentimentScore,
  fetchSentiment,
} from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';
import type { LegacyDetailedAnalyticsMode } from '@/modules/analytics/legacy-detailed-analytics';
import { getLegacyAnalyticsOverview } from '@/modules/analytics/legacy-analytics-overview';
import type { LegacyAnalyticsOverviewItem } from '@/modules/analytics/legacy-analytics.types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useRef, useState } from 'react';

type AnalyticsMode = LegacyAnalyticsOverviewItem['mode'];

export const useAnalyticsData = (knownUserId?: string) => {
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<LegacyAnalyticsOverviewItem[]>([]);
  const [currentSentimentDetailed, setCurrentSentimentDetailed] =
    useState<SentimentScore | null>(null);
  const overviewCache = useRef<
    Partial<Record<AnalyticsMode, LegacyAnalyticsOverviewItem[]>>
  >({});

  const resolveUserId = async () => {
    if (knownUserId) {
      return knownUserId;
    }

    const user = await serverGetLoggedInUser();
    return user.id;
  };

  // Dashboard overview: fetch only the fields required by the skill cards.
  // Results are cached per mode for this page visit so switching back does not
  // repeat the same database work.
  const fetchOverviewData = async (mode: AnalyticsMode) => {
    const cached = overviewCache.current[mode];
    if (cached) {
      setOverview(cached);
      setError(null);
      setLoadingOverview(false);
      return;
    }

    try {
      setLoadingOverview(true);
      setError(null);

      const userId = await resolveUserId();
      const summaries = await getLegacyAnalyticsOverview(userId, mode);

      overviewCache.current[mode] = summaries;
      setOverview(summaries);
    } catch (err) {
      setError('Failed to fetch overview analytics data.');
      console.error('Error fetching overview data:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Detailed analytics load score/criterion/trend data first. Large answer
  // transcript JSON is fetched separately only for optional sentiment enrichment.
  const fetchDetailedData = async (
    currentTemplateId: string,
    interviewMode: LegacyDetailedAnalyticsMode,
  ) => {
    try {
      setLoadingDetailed(true);
      setError(null);
      setCurrentSentimentDetailed(null);

      const userId = await resolveUserId();
      if (!currentTemplateId) {
        setError('Template ID not found.');
        setLoadingDetailed(false);
        return null;
      }

      const {
        getLegacyDetailedAnalytics,
        getLegacyDetailedAnalyticsAnswers,
      } = await import('@/modules/analytics/legacy-detailed-analytics');
      const analytics = await getLegacyDetailedAnalytics(
        userId,
        currentTemplateId,
        interviewMode,
      );

      if (!analytics) {
        setError('No detailed analytics returned.');
        setLoadingDetailed(false);
        return null;
      }

      // Unblock the main analytics view before optional transcript + sentiment work.
      setLoadingDetailed(false);

      void getLegacyDetailedAnalyticsAnswers(
        userId,
        currentTemplateId,
        interviewMode,
      )
        .then((answers) =>
          answers.length > 0 ? fetchSentiment(answers) : Promise.resolve(null),
        )
        .then((sentiment) => setCurrentSentimentDetailed(sentiment))
        .catch((sentimentError) => {
          console.error('Sentiment enrichment unavailable:', sentimentError);
        });

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
