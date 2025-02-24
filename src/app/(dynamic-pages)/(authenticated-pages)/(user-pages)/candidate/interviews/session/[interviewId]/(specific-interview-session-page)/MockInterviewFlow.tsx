'use client';

import { useState, useEffect, useRef } from 'react';
import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

import { insertInterviewAnswer, updateInterview } from '@/data/user/interviews';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { useNotifications } from '@/contexts/NotificationsContext';

import type {
  Interview,
  InterviewQuestion,
  InterviewAnswerDetail,
  FeedbackData,
} from '@/types';

type MockInterviewFlowFlowProps = {
  interview: Interview;
  questions: InterviewQuestion[];
};

export function MockInterviewFlow({
  interview,
  questions,
}: MockInterviewFlowFlowProps) {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    interview.current_question_index,
  );
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const answers = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  const startTimer = () => {
    if (timerRef.current == null) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!answer.trim()) {
      return;
    }
    try {
      // Insert into DB
      await insertInterviewAnswer(questions[currentQuestionIndex].id, answer);
      answers.current.push(answer);

      // Move to the next question
      if (currentQuestionIndex < questions.length - 1) {
        await updateInterview({
          id: interview.id,
          status: 'in_progress',
          current_question_index: currentQuestionIndex + 1,
        });
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // complete
        finishInterview();
      }
    } catch (error) {
      console.error('Error in handleAnswer for mock interview:', error);
    }
  };

  const finishInterview = async () => {
    stopTimer();
    setIsInterviewComplete(true);

    // Mark the interview as completed
    await updateInterview({
      id: interview.id,
      status: 'completed',
      current_question_index: currentQuestionIndex + 1,
      end_time: new Date().toISOString(),
    });

    // Possibly get overall feedback for the entire interview
    const answerDetails: InterviewAnswerDetail[] = questions.map((q, idx) => ({
      question: q.text,
      answer: answers.current[idx],
      mark: 0, // or if you store somewhere
      feedback: '',
      evaluation_criteria_name: q.evaluation_criteria.name,
    }));

    try {
      const feedback: FeedbackData | null = await getInterviewFeedback(
        interview,
        interview.evaluation_criterias ?? [],
        answerDetails,
      );

      if (feedback) {
        addNotification({
          title: 'Interview Complete',
          message: 'Your interview feedback is being processed',
          link: `/candidate/interview-history/${interview.id}`,
        });
      }
    } catch (err) {
      console.error('Error fetching interview feedback:', err);
    }
  };

  if (isInterviewComplete) {
    return (
      <div className="flex flex-col items-center min-h-screen justify-center">
        <h1 className="text-2xl font-bold">Interview Complete</h1>
        <p className="mt-4">Thank you for your time!</p>
        <Button onClick={() => router.push('/candidate')}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="interview-flow-container flex flex-col items-center min-h-screen">
      <Button variant="destructive" onClick={() => window.history.back()}>
        Leave Session
      </Button>

      <div className="flex w-full max-w-4xl">
        <div className="w-1/2 p-4">
          <AIQuestionSpeaker
            question={questions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            questionsLength={questions.length}
          />
        </div>
        <div className="w-1/2 p-4">
          <Card className="p-4 text-center mb-5">
            <h1 className="text-2xl font-bold">Timer</h1>
            <p>
              {Math.floor(recordingTime / 60)}:
              {('0' + (recordingTime % 60)).slice(-2)}
            </p>
          </Card>
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Candidate</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCamera
                answerCallback={handleAnswer}
                isCameraOn={true}
                // In live mode, maybe automatically proceed after recording
                onRecordEnd={() => {
                  questions[currentQuestionIndex + 1]
                }}
                // Not needed for live mode
                isFetchingSpecificFeedback={() => null}
                interviewMode={interview.mode}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
