'use client';
import { InterviewHistoryDetails } from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';

export default function InterviewHistoryDetailsPage({
  interviewId,
}: {
  interviewId: string;
}) {
  if (!interviewId || typeof interviewId !== 'string') {
    return <div className="text-center p-4">Invalid interview ID.</div>;
  }

  return <InterviewHistoryDetails interviewId={interviewId} />;
}
