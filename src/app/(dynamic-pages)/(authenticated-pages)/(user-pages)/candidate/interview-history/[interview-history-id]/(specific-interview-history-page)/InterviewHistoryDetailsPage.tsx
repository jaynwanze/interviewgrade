'use client';
import { InterviewHistoryDetails } from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';

export default function InterviewHistoryDetailsPage({
  historyId,
}: {
  historyId: string;
}) {
  if (!historyId || typeof historyId !== 'string') {
    return <div className="text-center p-4">Invalid interview ID.</div>;
  }

  return <InterviewHistoryDetails interviewId={historyId} />;
}
