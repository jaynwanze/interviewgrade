import { Suspense } from 'react';

import type {
  CandidateSessionHistoryItem,
  CandidateSessionHistorySummary,
} from '@/modules/session/candidate-session-history';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import InterviewTemplatesPage from './InterviewTemplatesPage';
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

export default async function InterviewAnaltyicsPage() {
  const user = await serverGetLoggedInUser();
  const v2Progress = await loadV2Progress(user.id);

  return (
    <div>
      {v2Progress && (
        <V2CandidateProgress
          summary={v2Progress.summary}
          recentSessions={v2Progress.recentSessions}
        />
      )}
      <Suspense>
        <InterviewTemplatesPage />
      </Suspense>
    </div>
  );
}
