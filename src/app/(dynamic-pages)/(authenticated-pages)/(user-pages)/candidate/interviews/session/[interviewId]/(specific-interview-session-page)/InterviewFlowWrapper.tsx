'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
// Import the data-fetching helpers, types, etc.
import { getInterview, getInterviewQuestions } from '@/data/user/interviews';
import { PracticeInterviewFlow } from './PracticeInterviewFlow';
import { MockInterviewFlow } from './MockInterviewFlow';
import { LoadingSpinner } from '@/components/LoadingSpinner';

import type { Interview, InterviewQuestion } from '@/types';

// This wrapper decides which flow to show based on interview mode
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
      const fetchedInterview = await getInterview(interviewId);
      if (!fetchedInterview) {
        console.error('Interview not found.');
        setInterview(null);
        setIsLoading(false);
        return;
      }
      // If the interview is already completed
      if (fetchedInterview.status === 'completed') {
        setCompletionMessage(
          'This interview has already been completed. Please go back to view your interview history.',
        );
        setInterview(null);
        setIsLoading(false);
        return;
      }

      const interviewQuestions = await getInterviewQuestions(interviewId);

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
    // At this point, if we still have no interview, show an error
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-center">
          Interview not found or could not be loaded.
        </h1>
      </div>
    );
  }

  // Conditionally render the flow based on interview.mode, e.g. 'practice' vs 'live'
  if (interview.mode === 'practice') {
    return (
      <PracticeInterviewFlow
        interview={interview}
        questions={questions}
        isTutorialMode={tutorialParam === '1'}
      />
    );
  } else {
    return <MockInterviewFlow interview={interview} questions={questions} />;
  }
}
