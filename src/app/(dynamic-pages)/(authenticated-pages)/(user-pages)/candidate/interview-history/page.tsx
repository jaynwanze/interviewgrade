'use client';

import InterviewHistoryPage from './InterviewHistoryPage';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

export default async function InterviewHistory() {
  const user = await serverGetLoggedInUser();
  
  if (!user) {
    throw new Error('User not found');
  }

  return <InterviewHistoryPage candidateId={user.id} />;
}