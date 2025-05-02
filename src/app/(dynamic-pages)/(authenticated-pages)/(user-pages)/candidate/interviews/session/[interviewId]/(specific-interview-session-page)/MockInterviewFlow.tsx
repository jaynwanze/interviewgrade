'use client';

import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useNotifications } from '@/contexts/NotificationsContext';
import { insertInterviewAnswer, updateInterview } from '@/data/user/interviews';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';

import type {
  FeedbackData,
  Interview,
  InterviewAnswerDetail,
  InterviewEvaluation,
  InterviewQuestion,
} from '@/types';
import { CheckCircle, ChevronLeft } from 'lucide-react';

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
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview,
          criteria: interview.evaluation_criterias ?? [],
          answers: answerDetails,
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      // The route returns { status:'ok', feedback:{…} }
      const { feedback } = (await res.json()) as {
        status: 'ok';
        feedback: InterviewEvaluation;
      };

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gr">
        <div className="p-6  shadow-lg rounded-lg text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center space-x-2 gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>Mock Interview Complete!</span>
          </h1>
          <p className="text-lg mb-6">
            Check your session report in the notification link when it becomes
            available.
          </p>
          <Button
            onClick={() => router.push('/candidate')}
            className="px-6 py-3 transition-all"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-flow-container flex flex-col items-center min-h-screen ">
      <div className="w-full flex items-center justify-between shadow-md px-6 py-3 rounded-lg mb-4 border">
        <div className="flex items-center space-x-2">
          <div className="text-lg font-bold  d0 truncate">
            {interview?.title}
          </div>

          <span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 rounded ">
            Mock Interview
          </span>
        </div>
        <div className="text-md font-semibold text-gray-700 dark:text-gray-300">
          ⏱ {Math.floor(recordingTime / 60)}:
          {('0' + (recordingTime % 60)).slice(-2)}
        </div>
        <Button variant="destructive" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Leave Session
        </Button>
      </div>
      <div className="flex w-full max-w-4xl">
        <div className="w-1/2 p-4">
          <AIQuestionSpeaker
            question={questions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            questionsLength={questions.length}
          />
        </div>
        <div className="w-1/2 p-4 flex justify-center items-center ">
          <Card className="flex flex-col justify-between max-w-md mx-auto text-center h-full ">
            <CardHeader
              className={`flex flex-row p-4 border-b dark:border-gray-700 bg-muted/50 mb-2`}
            >
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold">
                  Candidate
                </CardTitle>
              </div>
            </CardHeader>
            <div className="flex justify-center items-center">
              <span className="bg-blue-200 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-2">
                You
              </span>
            </div>
            <CardContent className="flex-1 flex flex-col justify-center items-center">
              <UserCamera
                answerCallback={handleAnswer}
                isCameraOn={true}
                // In live mode,
                onRecordEnd={() => {
                  questions[currentQuestionIndex + 1];
                }}
                // Not needed for interview mode
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
