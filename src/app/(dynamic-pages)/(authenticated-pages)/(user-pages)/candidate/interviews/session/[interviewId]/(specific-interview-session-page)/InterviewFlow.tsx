'use client';

import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { InterviewFeedback } from '@/components/Interviews/InterviewFlow/InterviewFeedback';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { T } from '@/components/ui/Typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getInterview,
  getInterviewQuestions,
  insertInterviewAnswer,
  updateInterview
} from '@/data/user/interviews';
import {
  EvaluationCriteriaType,
  Interview,
  InterviewEvaluation,
  InterviewQuestion
} from '@/types';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function InterviewFlow({
  interviewId,
}: {
  interviewId: string;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState(false);
  const [answersLength, setAnswersLength] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const answers = useRef<string[]>([]);
  const [interviewFeedback, setInterviewFeedback] =
    useState<InterviewEvaluation | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<
    EvaluationCriteriaType[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  const fetchInterview = async () => {
    setIsLoading(true);
    try {
      const interview = await getInterview(interviewId);
      if (!interview) {
        console.error('Interview not found.');
        return;
      }
      setInterview(interview);

      // Check if the interview is already completed
      if (interview.status === 'completed') {
        setCompletionMessage(
          'This interview has already been completed. Please go back to view the interview history section to view details.',
        );
        return;
      }

      const interviewQuestions = await getInterviewQuestions(interviewId);
      if (interviewQuestions.length === 0) {
        console.error('No interview questions found.');
        return;
      }
      setQuestions(interviewQuestions);
      setCurrentQuestionIndex(interview.current_question_index);

      if (interview.current_question_index !== 0) {
        answers.current = interviewQuestions
          .slice(0, interview.current_question_index)
          .map(() => '');
        setAnswersLength(answers.current.length);
      }
      setEvaluationCriteria(interview.evaluation_criteria ?? []);
    } catch (error) {
      console.error('Error fetching interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterview();
  }, []);

  useEffect(() => {
    if (isQuestionsComplete && answersLength === questions.length) {
      handleInterviewComplete();
    }
  }, [isQuestionsComplete, answersLength, questions.length]);

  const handleAnswer = useCallback(
    (answer: string) => {
      answers.current.push(answer);
      setAnswersLength(answers.current.length);
      insertInterviewAnswer(questions[currentQuestionIndex].id, answer);
      updateInterviewState(currentQuestionIndex + 1);
    },
    [questions, currentQuestionIndex],
  );

  const handleNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prevIndex) => {
      if (prevIndex < questions.length - 1) {
        return prevIndex + 1;
      } else {
        setIsQuestionsComplete(true);
        return prevIndex;
      }
    });
  }, [questions.length]);

  const handleInterviewComplete = async () => {
    setIsFetchingFeedback(true);
    const questionsText = questions.map((question) => question.text);
    try {
      const feedback = await getInterviewFeedback(
        interview?.id ?? '',
        interview?.title ?? '',
        questionsText,
        answers.current,
        evaluationCriteria,
      );

      setInterviewFeedback(feedback);
      setIsInterviewComplete(true);
      setIsCameraOn(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const updateInterviewState = async (nextQuestionIndex: number) => {
    if (interview) {
      const newStatus: 'in_progress' | 'completed' =
        nextQuestionIndex < questions.length ? 'in_progress' : 'completed';
      const updateData = {
        id: interview.id,
        status: newStatus,
        current_question_index: nextQuestionIndex,
        ...(newStatus === 'completed' && {
          end_time: new Date().toISOString(),
        }),
      };

      await updateInterview(updateData);
      setCurrentQuestionIndex(nextQuestionIndex);
    }
  };
  if (completionMessage) {
    return <div className="text-center p-4">{completionMessage}</div>;
  }

  if (!interview && isLoading) {
    return (
      <div className="interview-flow-container flex justify-center items-center min-h-screen">
        <LoadingSpinner />;
      </div>
    );
  } else if (!interview && !isLoading) {
    return (
      <div className="interview-flow-container flex justify-center items-center min-h-screen">
        <h1 className="text-3xl font-bold text-center">
          Interview not found. Please check the interview link
        </h1>
      </div>
    );
  }

  return (
    <div className="interview-flow-container flex justify-center items-center min-h-screen">
      {!isInterviewComplete ? (
        <div className="flex w-full max-w-4xl">
          {questions[currentQuestionIndex] ? (
            <>
              <div className="left-side w-1/2 p-4">
                <AIQuestionSpeaker
                  question={questions[currentQuestionIndex]}
                  currentIndex={currentQuestionIndex}
                  questionsLength={questions.length}
                />
              </div>
              <div className="right-side w-1/2 p-4">
                <Card className="max-w-md text-center">
                  <CardHeader>
                    <CardTitle>Candidate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserCamera
                      answerCallback={handleAnswer}
                      isCameraOn={true}
                      onRecordEnd={handleNextQuestion}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="interview-flow-container flex justify-center items-center min-h-screen">
              <LoadingSpinner />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <T.Subtle>Interview Completed!</T.Subtle>
          {interviewFeedback && interview ? (
            <InterviewFeedback
              interviewTitle={interview.title ?? ''}
              feedback={interviewFeedback}
            />
          ) : (
            <p>Loading feedback...</p>
          )}
        </div>
      )}
    </div>
  );
}
