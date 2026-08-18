import type { CandidateSessionHistoryItem } from '@/modules/session/candidate-session-history';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import InterviewHistoryPage from './InterviewHistoryPage';

async function loadV2History(
  userId: string,
): Promise<CandidateSessionHistoryItem[]> {
  try {
    const { listCandidateSessionHistory } = await import(
      '@/modules/session/candidate-session-history'
    );
    return await listCandidateSessionHistory(userId);
  } catch (error) {
    console.error('InterviewHistory: v2 session history unavailable', error);
    return [];
  }
}

export default async function InterviewHistory() {
  const user = await serverGetLoggedInUser();
  const v2Sessions = await loadV2History(user.id);

  return <InterviewHistoryPage v2Sessions={v2Sessions} />;
}
