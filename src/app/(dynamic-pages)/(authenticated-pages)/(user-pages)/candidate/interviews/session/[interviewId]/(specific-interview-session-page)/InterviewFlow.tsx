'use client';

import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationsContext';
import { markTutorialAsDoneAction } from '@/data/user/candidate';
import {
  getInterview,
  getInterviewQuestions,
  insertInterviewAnswer,
  updateInterview,
} from '@/data/user/interviews';
import {
  EvaluationCriteriaType,
  FeedbackData,
  Interview,
  InterviewAnswerDetail,
  InterviewQuestion,
  specificFeedbackType,
} from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { getQuestionFeedback } from '@/utils/openai/getQuestionFeedback';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function InterviewFlow({
  interviewId,
}: {
  interviewId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorialParam = searchParams.get('tutorial'); // "1" if it's a tutorial
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const answers = useRef<string[]>([]);
  const [interviewFeedback, setInterviewFeedback] =
    useState<FeedbackData | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<
    EvaluationCriteriaType[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );
  const [evaluationCriterias, setEvaluationCriterias] = useState<
    EvaluationCriteriaType[]
  >([]);
  const [isFetchingSpecificFeedback, setIsFetchingSpecificFeedback] =
    useState(false);
  const [specificFeedback, setSpecificFeedback] =
    useState<specificFeedbackType | null>();
  const timerRef = useRef<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [questionFeedback, setQuestionFeedback] = useState<{
    [key: number]: specificFeedbackType | null;
  }>({});
  const [scoreStringColour, setScoreStringColour] = useState('');
  const { addNotification } = useNotifications();
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  useEffect(() => {
    // If there's a param "tutorial=1", we know it's a tutorial flow
    if (tutorialParam === '1') {
      setIsTutorialMode(true);
    }
  }, [tutorialParam]);

  const startTimer = () => {
    if (timerRef.current == null) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    // // end interview if time runs out
    //might to set rest of answers to empty string
    setTimeout(
      () => {
        //handleInterviewComplete();
      },
      interview?.duration ? interview.duration * 60 * 1000 : 0,
    );
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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

      const evaluationCriterias: EvaluationCriteriaType[] = interviewQuestions
        .map((question) => [question.evaluation_criteria])
        .flat();
      setEvaluationCriterias(evaluationCriterias);

      if (interview.current_question_index !== 0) {
        answers.current = interviewQuestions
          .slice(0, interview.current_question_index)
          .map(() => '');
      }
      setEvaluationCriteria(interview.evaluation_criterias ?? []);
      setIsCameraOn(true);
      startTimer();
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
    return () => {
      setIsCameraOn(false);
    };
  }, []);

  useEffect(() => {
    if (isQuestionsComplete && answers.current.length === questions.length) {
      handleInterviewComplete();
    }
  }, [isQuestionsComplete, answers.current.length, questions.length]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      try {
        // Validate the answer before proceeding
        if (!answer.trim()) {
          console.warn('Received an empty answer.');
          //TODO: Show an error message to the user
          // Retry the answer and start recording again
          return;
        }

        //Perfrom database operations
        await insertInterviewAnswer(questions[currentQuestionIndex].id, answer);
        await updateInterviewState(currentQuestionIndex + 1);
        // Push the answer to the answers array
        answers.current.push(answer);
        if (interview?.mode === INTERVIEW_PRACTICE_MODE) {
          await fetchSpecificFeedback(answer);
        }
      } catch (error) {
        console.error('Error in handleAnswer:', error.message || error);
        // Optionally, set an error state here to inform the user
      }
    },
    [questions, questionFeedback, currentQuestionIndex, interview],
  );

  const fetchSpecificFeedback = async (answer: string) => {
    setIsFetchingSpecificFeedback(true);
    try {
      const nextQuestionIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextQuestionIndex] || null;

      const specificFeedbackData = await getQuestionFeedback(
        interview?.skill ?? '',
        questions[currentQuestionIndex],
        answer,
        nextQuestion,
        interview?.question_count ?? 0,
        evaluationCriterias,
      );
      if (specificFeedbackData) {
        setQuestionFeedback((prev) => ({
          ...prev,
          [currentQuestionIndex]: specificFeedbackData,
        }));
      } else {
        setQuestionFeedback((prev) => ({
          ...prev,
          [currentQuestionIndex]: null,
        }));
      }
    } catch (error) {
      console.error(
        'Error fetching specific feedback:',
        error.message || error,
      );
      setQuestionFeedback((prev) => ({
        ...prev,
        [currentQuestionIndex]: null,
      }));
    } finally {
      setIsFetchingSpecificFeedback(false);
    }
  };

  useEffect(() => {
    // Reset specific feedback whenever the current question index changes
    setSpecificFeedback(null);
  }, [currentQuestionIndex]);

  const handleInterviewComplete = async () => {
    setIsInterviewComplete(true);
    setIsCameraOn(false);
    stopTimer();

    // Validate interview data before proceeding
    if (!interview?.id || !interview?.title) {
      throw new Error('Interview ID or Title is missing.');
    }

    // Ensure synchronization between questions and answers IF the interview is not in practice mode
    if (
      questions.length !== answers.current.length &&
      interview.mode !== INTERVIEW_PRACTICE_MODE
    ) {
      console.error('Mismatch between number of questions and answers.');
      return;
    }

    // Prepare the interview answers details for question answered
    const interviewAnswersDetails: InterviewAnswerDetail[] = questions.map(
      (question, index) => ({
        question: question.text,
        answer: answers.current[index],
        mark: questionFeedback[index]?.mark ?? 0,
        feedback: questionFeedback[index]?.summary ?? '',
        evaluation_criteria_name: question.evaluation_criteria.name,
      }),
    );

    try {
      const feedback: FeedbackData | null = await getInterviewFeedback(
        interview,
        evaluationCriteria,
        interview.mode === 'practice'
          ? interviewAnswersDetails.splice(currentQuestionIndex + 1)
          : interviewAnswersDetails,
      );

      setInterviewFeedback(feedback);
      if (feedback) {
        // Add notification
        addNotification({
          title: 'Feedback Ready',
          message: 'Your interview feedback is ready. Click to view.',
          link: `/candidate/interview-history/${interview.id}`,
        });
        if (isTutorialMode) {
          await markTutorialAsDoneAction().then(() => {
            router.replace('/candidate');
          });
        }
      }
    } catch (error) {
      // Handle error better
      console.error('Error fetching feedback:', error.message || error);
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

      try {
        await updateInterview(updateData);
      } catch (error) {
        console.error(
          'Error updating interview state:',
          error.message || error,
        );
      }
    }
  };
  useEffect(() => {
    if (questionFeedback[currentQuestionIndex]) {
      const score = Math.round(
        ((questionFeedback[currentQuestionIndex]?.mark ?? 0) /
          maxScorePerQuestion) *
          100,
      );
      if (score >= 80) {
        setScoreStringColour('text-green-600');
      } else if (score >= 60) {
        setScoreStringColour('text-yellow-600');
      } else if (score >= 40) {
        setScoreStringColour('text-orange-600');
      } else {
        setScoreStringColour('text-red-600');
      }
    }
  }, [questionFeedback[currentQuestionIndex]]);

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
  const maxScorePerQuestion = Math.floor(
    100 / (interview?.question_count || 1),
  );
  if (completionMessage) {
    return <div className="text-center p-4">{completionMessage}</div>;
  }

  if (
    (!interview && isLoading) ||
    (!isInterviewComplete && !questions[currentQuestionIndex])
  ) {
    return (
      <div className="interview-flow-container flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  } else if (!interview && !isLoading) {
    return (
      <div className="interview-flow-container flex justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-center">
          Interview not found. Please check the interview link
        </h1>
      </div>
    );
  } else if (isInterviewComplete) {
    return (
      <div className="interview-flow-container flex flex-col items-center min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <p className="text-center text-lg">
              Your interview is complete. Thank you for participating!
            </p>
            <p className="text-center text-lg">
              Feedback is being processed. You will receive a notification when
              it's ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-2 flex flex-col space-y-2 overflow-hidden">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between bg-white dark:bg-gray-900 shadow-md px-6 py-3 rounded-lg mb-4 border">
        <div className="flex items-center space-x-2">
          <div className="text-lg font-semibold text-blue-700 dark:text-blue-300 truncate">
            {interview?.title}
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
            Interview Mode
          </span>
        </div>
        <div className="text-md font-semibold">
          ⏱ {Math.floor(recordingTime / 60)}:
          {('0' + (recordingTime % 60)).slice(-2)}
        </div>
        <Button variant="destructive" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Leave
        </Button>
      </div>

      {/* Main Interview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full">
        {/* Question Panel */}
        <div className="col-span-1">
          <AIQuestionSpeaker
            question={questions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            questionsLength={questions.length}
          />
        </div>

        {/* Candidate Panel: center using col-span-2 */}
        <div className="col-span-2 flex flex-col space-y-4">
          <Card className="text-center shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Candidate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center items-center space-y-4">
              <UserCamera
                answerCallback={handleAnswer}
                isCameraOn={isCameraOn}
                onRecordEnd={
                  interview?.mode === INTERVIEW_PRACTICE_MODE
                    ? null
                    : handleNextQuestion
                }
                isFetchingSpecificFeedback={setIsFetchingSpecificFeedback}
                interviewMode={interview?.mode ?? null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
