'use client';

import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationsContext';
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
  InterviewQuestion,
  specificFeedbackType,
} from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
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
  const [isFetchingSpecificFeedback, setIsFetchingSpecificFeedback] =
    useState(false);
  const [specificFeedback, setSpecificFeedback] =
    useState<specificFeedbackType | null>();
  const timerRef = useRef<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [questionFeedback, setQuestionFeedback] = useState<{
    [key: number]: specificFeedbackType | null;
  }>({});
  const [questionFeedbackMarkDisplayText, setQuestionFeedbackMarkDisplayText] =
    useState<{
      [key: number]: string | null;
    }>({});
  const [
    questionFeedbackSummaryDisplayText,
    setQuestionFeedbackSummaryDisplayText,
  ] = useState<{
    [key: number]: string | null;
  }>({});
  const [
    questionFeedbackAdviceDisplayText,
    setQuestionFeedbackAdviceDisplayText,
  ] = useState<{
    [key: number]: string | null;
  }>({});
  const { addNotification } = useNotifications();
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

      if (interview.current_question_index !== 0) {
        answers.current = interviewQuestions
          .slice(0, interview.current_question_index)
          .map(() => '');
        setAnswersLength(answers.current.length);
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
    if (isQuestionsComplete && answersLength === questions.length) {
      handleInterviewComplete();
    }
  }, [isQuestionsComplete, answersLength, questions.length]);

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
        // Push the answer to the answers array
        answers.current.push(answer);
        setAnswersLength(answers.current.length);

        await insertInterviewAnswer(questions[currentQuestionIndex].id, answer);
        await updateInterviewState(currentQuestionIndex + 1);
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
  // components/Interviews/InterviewFlow.tsx

  const fetchSpecificFeedback = async (answer: string) => {
    setIsFetchingSpecificFeedback(true);
    try {
      const nextQuestionIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextQuestionIndex] || null;

      const response = await fetch('/api/getQuestionFeedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: interview?.skill ?? '',
          currentQuestion: questions[currentQuestionIndex],
          currentAnswer: answer,
          nextQuestion,
          interview_question_count: interview?.question_count ?? 0,
        }),
      });

      if (!response.ok || !response.body) {
        console.error('Failed to get feedback from OpenAI.');
        return;
      }

      let accumulatedText = '';
      let markDisplayText = '';
      let summaryDisplayText = '';
      let adviceDisplayText = '';

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let doneReading = false;
      let readingMark = false;
      let readingSummary = false;
      let readingAdvice = false;
      setIsFetchingSpecificFeedback(false);
      while (!doneReading) {
        const { value, done } = await reader.read();
        if (done) {
          doneReading = true;
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        const lines = accumulatedText.split('\n\n');
        accumulatedText = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace(/^data:/, '').trim();
            if (data === '[DONE]') {
              doneReading = true;
              break;
            }
            console.log('data:', data);
            // /// check what coming on the frontend and if it matches the data
            // if (data === 'mark') {
            //   readingMark = true;
            // }
            // if (data === 'summary') {
            //   readingSummary = true;
            // }
            // if (data === '"advice_for_next_question"') {
            //   readingAdvice = true;
            // }

            // if (readingMark) {
            //   markDisplayText += data + ' ';
            //   setQuestionFeedbackMarkDisplayText((prev) => ({
            //     ...prev,
            //     [currentQuestionIndex]: markDisplayText,
            //   }));
            // }
            // if (readingSummary) {
            //   summaryDisplayText += data + ' ';
            //   setQuestionFeedbackSummaryDisplayText((prev) => ({
            //     ...prev,
            //     [currentQuestionIndex]: summaryDisplayText,
            //   }));
            // }
            // if (readingAdvice) {
            //   adviceDisplayText += data + ' ';
            //   setQuestionFeedbackAdviceDisplayText((prev) => ({
            //     ...prev,
            //     [currentQuestionIndex]: adviceDisplayText,
            //   }));
            // }
            // accumulatedText += data;
             // Parse the raw JSON string
             try {
              const parsed = JSON.parse(data);
              // Validate the structure
              if (
                typeof parsed.mark === 'number' &&
                typeof parsed.summary === 'string' &&
                typeof parsed.advice_for_next_question === 'string'
              ) {
                // Update the state with the parsed feedback
                setQuestionFeedback((prev) => ({
                  ...prev,
                  [currentQuestionIndex]: parsed,
                }));
              } else {
                throw new Error('Invalid feedback structure');
              }

          }
        }
      }
      // Now, parse the accumulated JSON
    } catch (error) {
      console.error('Error fetching specific feedback:', error);
      setQuestionFeedback((prevFeedback) => ({
        ...prevFeedback,
        [currentQuestionIndex]: {
          mark: 0,
          summary: 'Error parsing feedback.',
          advice_for_next_question: 'Please try again later.',
        },
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
    // Ensure synchronization between questions and answers
    if (questions.length !== answers.current.length) {
      console.error('Mismatch between number of questions and answers.');
      return;
    }

    // const interviewAnswersDetails: InterviewAnswerDetail[] = questions.map(
    //   (question, index) => ({
    //     question: question.text,
    //     answer: answers.current[index],
    //     mark: questionFeedback[index]?.mark ?? 0,
    //     feedback: questionFeedback[index]?.summary ?? '',
    //     evaluation_criteria_name: question.evaluation_criteria.name,
    //   }),
    // );

    try {
      // Validate interview data before proceeding
      if (!interview?.id || !interview?.title) {
        throw new Error('Interview ID or Title is missing.');
      }

      // const feedback: FeedbackData | null = await getInterviewFeedback(
      //   interview,
      //   evaluationCriteria,
      //   interviewAnswersDetails,
      // );

      // setInterviewFeedback(feedback);
      // if (feedback) {
      //   // Add notification
      //   addNotification({
      //     title: 'Feedback Ready',
      //     message: 'Your interview feedback is ready. Click to view.',
      //     link: `/candidate/interview-history/${interview.id}`,
      //   });
      // }
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
    return (
      <div className="interview-flow-container flex justify-center items-center min-h-screen text-center p-4">
        {completionMessage}
      </div>
    );
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
        <h1 className="text-3xl font-bold text-center">
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
        <h1 className="text-3xl font-bold text-center">
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
    <div className="interview-flow-container flex flex-col items-center min-h-screen">
      {/* Main Cards: AIQuestionSpeaker and UserCamera */}
      <div className="flex items-center justify-center space-x-2">
        <Card className=" p-4 text-center">
          <h1 className="2xl font-bold">Timer</h1>
          <p>
            {Math.floor(recordingTime / 60)}:
            {('0' + (recordingTime % 60)).slice(-2)}
          </p>
        </Card>
      </div>
      <div className="flex w-full max-w-4xl">
        <div className="left-side w-1/2 p-4">
          <AIQuestionSpeaker
            question={questions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            questionsLength={questions.length}
          />
        </div>
        <div className="right-side w-1/2 p-4">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Candidate</CardTitle>
            </CardHeader>
            <CardContent>
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

      {/* Feedback Card: Appears beneath the main cards in practice mode */}
      {interview && interview.mode === INTERVIEW_PRACTICE_MODE && (
        <div className="w-full max-w-4xl p-4">
          <Card className="mx-auto text-center">
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {isFetchingSpecificFeedback ? (
                <div className="flex items-center justify-center space-x-2">
                  <p>Fetching feedback...</p>
                  <LoadingSpinner />
                </div>
              ) : questionFeedback[currentQuestionIndex] ||
                questionFeedbackMarkDisplayText ||
                questionFeedbackAdviceDisplayText ||
                questionFeedbackAdviceDisplayText ? (
                <>
                  <div className="text-left space-y-2">
                    {/* <p>
                      <strong>Mark:</strong>{' '}
                      {questionFeedback[currentQuestionIndex]?.mark}/
                      {maxScorePerQuestion}
                    </p>
                    <p>
                      <strong>Summary:</strong>{' '}
                      {questionFeedback[currentQuestionIndex]?.summary}
                    </p>
                    {currentQuestionIndex < questions.length - 1 && (
                      <p>
                        <strong>Advice for Next Question:</strong>{' '}
                        {
                          questionFeedback[currentQuestionIndex]
                            ?.advice_for_next_question
                        }
                      </p>
                    )} */}
                    {questionFeedbackMarkDisplayText && (
                      <p>
                        <strong>Mark:</strong>{' '}
                        {questionFeedbackMarkDisplayText[currentQuestionIndex]}/
                        {maxScorePerQuestion}
                      </p>
                    )}
                    {questionFeedbackSummaryDisplayText && (
                      <p>
                        <strong>Summary:</strong>{' '}
                        {
                          questionFeedbackSummaryDisplayText[
                          currentQuestionIndex
                          ]
                        }
                      </p>
                    )}
                    {questionFeedbackMarkDisplayText && (
                      <>
                        {currentQuestionIndex < questions.length - 1 && (
                          <p>
                            <strong>Advice for Next Question:</strong>{' '}
                            {
                              questionFeedbackAdviceDisplayText[
                              currentQuestionIndex
                              ]
                            }
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Button onClick={handleNextQuestion} className="mt-4">
                      {currentQuestionIndex === questions.length - 1
                        ? 'Finish Interview'
                        : 'Next Question'}
                    </Button>{' '}
                  </div>
                </>
              ) : (
                'After the question is answered, feedback will be loaded.'
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
