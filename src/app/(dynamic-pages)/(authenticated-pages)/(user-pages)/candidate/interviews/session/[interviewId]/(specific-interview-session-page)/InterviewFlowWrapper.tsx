'use client';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { loadLegacySessionAction } from '@/modules/session/legacy-session.actions';
import type { Interview, InterviewQuestion } from '@/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MockInterviewFlow } from './MockInterviewFlow';
import { PracticeInterviewFlow } from './PracticeInterviewFlow';

// This wrapper decides which flow to show based on interview mode.
// Session persistence is intentionally hidden behind the session module so the
// UI can stay stable while the underlying repository is migrated later.
export default function InterviewFlowWrapper({
  interviewId,
}: {
  interviewId: string;
}) {
  const searchParams = useSearchParams();
  const tutorialParam = searchParams.get('tutorial'); // "1" if it's a tutorial

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const session = await loadLegacySessionAction(interviewId);
      if (!session) {
        console.error('Interview not found.');
        setInterview(null);
        setIsLoading(false);
        return;
      }

      const {
        interview: fetchedInterview,
        questions: interviewQuestions,
      } = session;

      // If the interview is already completed
      if (fetchedInterview.status === 'completed') {
        setCompletionMessage(
          'This interview has already been completed. Please go back to view your interview history.',
        );
        setInterview(null);
        setIsLoading(false);
        return;
      }

      setInterview(fetchedInterview);
      setQuestions(interviewQuestions);
    } catch (error) {
      console.error('Error fetching interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (completionMessage) {
    return <div className="text-center p-4">{completionMessage}</div>;
  }

  if (!interview) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-center">
          Interview not found or could not be loaded.
        </h1>
      </div>
    );
  }

  if (interview.mode === 'practice') {
    return (
      <PracticeInterviewFlow
        interview={interview}
        questions={questions}
        isTutorialMode={tutorialParam === '1'}
      />
    );
  }

  return <MockInterviewFlow interview={interview} questions={questions} />;
}
