import { Suspense } from 'react';

import type { CandidatePracticeAnalytics } from '@/modules/analytics/candidate-practice-analytics';
import type {
  CandidateSessionHistoryItem,
  CandidateSessionHistorySummary,
} from '@/modules/session/candidate-session-history';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import InterviewTemplatesPage from './InterviewTemplatesPage';
import { V2CandidateAnalytics } from './V2CandidateAnalytics';
import { V2CandidateProgress } from './V2CandidateProgress';

type V2ProgressData = {
  summary: CandidateSessionHistorySummary;
  recentSessions: CandidateSessionHistoryItem[];
};

async function loadV2Progress(userId: string): Promise<V2ProgressData | null> {
  try {
    const {
      listCandidateSessionHistory,
      summarizeCandidateSessionHistory,
    } = await import('@/modules/session/candidate-session-history');
    const history = await listCandidateSessionHistory(userId);

    return {
      summary: summarizeCandidateSessionHistory(history),
      recentSessions: history.slice(0, 5),
    };
  } catch (error) {
    console.error('CandidateDashboard: v2 progress unavailable', error);
    return null;
  }
}

async function loadV2Analytics(
  userId: string,
): Promise<CandidatePracticeAnalytics | null> {
  try {
    const { getCandidatePracticeAnalytics } = await import(
      '@/modules/analytics/candidate-practice-analytics'
    );
    return await getCandidatePracticeAnalytics(userId);
  } catch (error) {
    console.error('CandidateDashboard: v2 analytics unavailable', error);
    return null;
  }
}

async function V2ProgressSection({ userId }: { userId: string }) {
  const progress = await loadV2Progress(userId);
  if (!progress) {
    return null;
  }

  return (
    <V2CandidateProgress
      summary={progress.summary}
      recentSessions={progress.recentSessions}
    />
  );
}

async function V2AnalyticsSection({ userId }: { userId: string }) {
  const analytics = await loadV2Analytics(userId);
  if (!analytics) {
    return null;
  }

  return <V2CandidateAnalytics analytics={analytics} />;
}

export default async function InterviewAnaltyicsPage() {
  const user = await serverGetLoggedInUser();

  return (
    <div>
      <Suspense fallback={<DashboardSectionFallback label="Loading progress…" />}>
        <V2ProgressSection userId={user.id} />
      </Suspense>

      <Suspense fallback={<DashboardSectionFallback label="Loading analytics…" />}>
        <V2AnalyticsSection userId={user.id} />
      </Suspense>

      <Suspense fallback={<DashboardSectionFallback label="Loading skills…" />}>
        <InterviewTemplatesPage userId={user.id} />
      </Suspense>
    </div>
  );
}

function DashboardSectionFallback({ label }: { label: string }) {
  return (
    <div className="container mx-auto w-3/4 px-4 pt-4">
      <div className="h-24 animate-pulse rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
