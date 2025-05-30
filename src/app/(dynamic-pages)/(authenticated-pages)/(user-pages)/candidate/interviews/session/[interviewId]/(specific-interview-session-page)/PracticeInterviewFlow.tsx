'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useNotifications } from '@/contexts/NotificationsContext';
import { markTutorialAsDoneAction } from '@/data/user/candidate';
import { insertInterviewAnswer, updateInterview } from '@/data/user/interviews';
import type {
  Interview,
  InterviewAnswerDetail,
  InterviewEvaluation,
  InterviewQuestion,
  specificFeedbackType,
} from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  CheckCircleIcon,
  ChevronLeft,
  MessageSquare,
  SidebarOpenIcon,
} from 'lucide-react';

type PracticeInterviewFlowProps = {
  interview: Interview;
  questions: InterviewQuestion[];
  isTutorialMode: boolean;
};
function parsePartial(text: string) {
  const result: {
    mark?: number;
    summary?: string;
    advice_for_next_question?: string;
  } = {};

  // 1) Score
  const scoreRegex = /Score \(%\):\s*(\d+)\s*\/\s*100%/;
  const scoreMatch = text.match(scoreRegex);
  if (
    scoreMatch &&
    scoreMatch[1] !== undefined &&
    scoreMatch[0].includes('/100%')
  ) {
    result.mark = parseInt(scoreMatch[1], 10);
  }

  // 2) Summary
  const summaryRegex = /Summary:\s*([\s\S]+?)(?=\nAdvice for Next Question|$)/;
  const summaryMatch = text.match(summaryRegex);
  if (summaryMatch && summaryMatch[1]) {
    result.summary = summaryMatch[1].trim();
  }

  // 3) Advice
  const adviceRegex = /Advice for Next Question:\s*([\s\S]+)/;
  const adviceMatch = text.match(adviceRegex);
  if (adviceMatch && adviceMatch[1]) {
    result.advice_for_next_question = adviceMatch[1].trim();
  }

  return result;
}

export function PracticeInterviewFlow({
  interview,
  questions,
  isTutorialMode,
}: PracticeInterviewFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    interview.current_question_index,
  );
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isFetchingSpecificFeedback, setIsFetchingSpecificFeedback] =
    useState(false);
  const [questionFeedback, setQuestionFeedback] = useState<{
    [key: number]: specificFeedbackType | null;
  }>({});

  const answers = useRef<string[]>([]);
  const { addNotification } = useNotifications();
  const [scoreStringColour, setScoreStringColour] = useState('');

  const router = useRouter();
  const maxScorePerQuestion = 100;
  const [partialText, setPartialText] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);

  // If needed, you can keep a timer for the entire practice session
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startTimer();
    // Cleanup on unmount
    return () => {
      stopTimer();
      setIsCameraOn(false);
    };
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
      // Possibly show a warning “Empty answer”
      return;
    }
    try {
      // DB insert
      await insertInterviewAnswer(questions[currentQuestionIndex].id, answer);
      answers.current.push(answer);

      // For practice mode, fetch immediate feedback
      await fetchSpecificFeedback(answer);

      // Move to the next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        // Update DB so we persist question index
        await updateInterview({
          id: interview.id,
          status: 'in_progress',
          current_question_index: currentQuestionIndex + 1,
        });
      }
    } catch (error) {
      console.error('Error in handleAnswer for practice mode:', error);
    }
  };

  const fetchSpecificFeedback = async (answer: string) => {
    setIsFetchingSpecificFeedback(true);

    let accumulatedText = '';
    let done = false;

    try {
      const nextQuestionIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextQuestionIndex] || null;

      const response = await fetch('/api/realtime-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: interview?.skill ?? '',
          currentQuestion: questions[currentQuestionIndex],
          currentAnswer: answer,
          nextQuestion,
          interview_question_count: interview?.question_count ?? 0,
          interview_evaluation_criterias: interview?.evaluation_criterias ?? [],
        }),
      });

      if (!response.ok || !response.body) {
        console.error('Failed to get feedback from OpenAI.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value);
          // chunk can have multiple SSE lines
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;
            if (line.startsWith('data: ')) {
              const data = line.replace(/^data:\s*/, '');
              if (data === '[DONE]') {
                done = true;
                break;
              }

              // Each SSE line is JSON-encoded text
              try {
                const token = JSON.parse(data) as string;
                accumulatedText += token;
                console.log('Accumulated text:', accumulatedText);

                // 1) Update partial text for the user
                setPartialText(accumulatedText);

                // 2) Attempt partial parse for “Score”, “Summary”, “Advice”
                const newFields = parsePartial(accumulatedText);
                console.log('Parsed fields:', newFields);

                if (Object.keys(newFields).length > 0) {
                  // Merge them into questionFeedback
                  setQuestionFeedback((prev) => ({
                    ...prev,
                    [currentQuestionIndex]: {
                      ...(prev[currentQuestionIndex] || {}),
                      ...newFields,
                    },
                  }));
                }
              } catch (err) {
                console.error('Error parsing SSE token as string:', err);
              }
            }
          }
        }
      }
    } finally {
      setIsFetchingSpecificFeedback(false);
    }
  };

  useEffect(() => {
    const feedback = questionFeedback[currentQuestionIndex];
    const score = feedback?.mark;

    if (score !== undefined && score !== null) {
      const rounded = Math.round(score);

      if (rounded >= 70) setScoreStringColour('text-green-600');
      else if (rounded >= 60) setScoreStringColour('text-lime-600');
      else if (rounded >= 50) setScoreStringColour('text-yellow-600');
      else if (rounded >= 40) setScoreStringColour('text-orange-600');
      else setScoreStringColour('text-red-600');
    } else {
      setScoreStringColour(''); // reset if not yet available
    }
  }, [questionFeedback[currentQuestionIndex]]);

  const finishInterview = async () => {
    stopTimer();
    setIsInterviewComplete(true);
    setIsCameraOn(false);

    // Mark interview as “completed” in DB
    await updateInterview({
      id: interview.id,
      status: 'completed',
      current_question_index: currentQuestionIndex + 1,
      end_time: new Date().toISOString(),
    });

    const answerDetails: InterviewAnswerDetail[] = questions.map((q, idx) => ({
      question: q.text,
      answer: answers.current[idx],
      mark: questionFeedback[idx]?.mark ?? 0,
      feedback: questionFeedback[idx]?.summary ?? '',
      evaluation_criteria_name: q.evaluation_criteria.name,
    }));

    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview,
          criteria: interview.evaluation_criterias ?? [],
          answers: answerDetails.splice(0, currentQuestionIndex + 1),
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
        // Notify the user or redirect
        addNotification({
          title: 'Practice Complete',
          message: 'You have finished the practice interview!',
          link: `/candidate/interview-history/${interview.id}`,
        });
        // If tutorial mode is on, mark it as done and redirect
        if (isTutorialMode) {
          await markTutorialAsDoneAction().then(() => {
            return router.replace('/candidate');
          });
        }
      }
    } catch (error) {
      console.error('Error fetching overall feedback:', error);
    }
  };

  if (isInterviewComplete && isTutorialMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen ">
        <div className="p-6 shadow-lg rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CheckCircleIcon className="text-green-500 h-6 w-6 animate-pulse" />
            <h1 className="text-3xl font-bold">Practice Complete!</h1>
          </div>
          <p className="text-lg mb-6">
            We are evaluating your session. Please hold tight!
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-grey-500 animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-grey-500 animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-grey-500 animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    );
  } else if (isInterviewComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gr">
        <div className="p-6  shadow-lg rounded-lg text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center space-x-2 gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>Practice Complete!</span>
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

  // Otherwise, show the main practice flow
  return (
    <div className="min-h-screen w-full p-2 flex flex-col space-y-2 overflow-hidden">
      {/* Top Control Bar */}
      <div className="w-full flex items-center justify-between shadow-md px-6 py-3 rounded-lg mb-4 border">
        <div className="flex items-center space-x-2">
          <div className="text-lg font-bold  d0 truncate">
            {interview.title}
          </div>

          <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-0.5 rounded ">
            Practice Mode
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

      {/* Grid Layout */}
      <div
        className={`grid gap-4 w-full h-full transition-all duration-300 ${isFeedbackOpen ? 'md:grid-cols-3' : 'md:grid-cols-2'}
          }`}
      >
        {/* Interviewer */}
        <AIQuestionSpeaker
          question={questions[currentQuestionIndex]}
          currentIndex={currentQuestionIndex}
          questionsLength={questions.length}
        />
        {/* Candidate */}
        <Card className="overflow-hidden flex flex-col justify-between">
          <CardHeader
            className={`flex flex-row ${isFeedbackOpen === true ? 'p-4' : 'p-2.5'} border-b dark:border-gray-700 bg-muted/50 mb-2`}
          >
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-lg font-semibold">Candidate</CardTitle>
              {/* Floating Button */}
              {!isFeedbackOpen && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex justify-end shadow-md mt-1"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Show Feedback
                </Button>
              )}
            </div>
          </CardHeader>
          <div className="flex justify-center items-center">
            <span className="bg-blue-200 text-blue-800 text-sm font-medium px-3 py-1 rounded-full  mb-2">
              You
            </span>
          </div>
          <CardContent className="flex-1 flex flex-col justify-center items-center">
            <UserCamera
              answerCallback={handleAnswer}
              isCameraOn={isCameraOn}
              onRecordEnd={null}
              isFetchingSpecificFeedback={setIsFetchingSpecificFeedback}
              interviewMode={interview.mode}
            />
          </CardContent>
        </Card>

        {/* Feedback */}
        <AnimatePresence>
          {isFeedbackOpen && (
            <motion.div
              key="feedback"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="col-span-1 w-full"
            >
              <Card className="shadow-md overflow-hidden flex flex-col justify-between">
                <CardHeader className="flex flex-row p-2.5 border-b dark:border-gray-700 bg-muted/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex justify-self-end"
                    onClick={() => setIsFeedbackOpen(false)}
                  >
                    <SidebarOpenIcon className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg font-semibold">
                    Practice Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full text-center">
                  {isFetchingSpecificFeedback ? (
                    questionFeedback[currentQuestionIndex] ? (
                      <>
                        <div className="text-left mt-4 space-y-3">
                          {questionFeedback[currentQuestionIndex]?.mark !==
                            undefined && (
                              <div className="text-center">
                                <strong className="block text-base">
                                  Score (%):
                                </strong>
                                <p
                                  className={`text-3xl font-bold mt-1 ${scoreStringColour}`}
                                >
                                  {Math.round(
                                    questionFeedback[currentQuestionIndex]
                                      ?.mark ?? 0,
                                  )}
                                  /100%
                                </p>
                              </div>
                            )}

                          {questionFeedback[currentQuestionIndex]?.summary && (
                            <div>
                              <strong>Summary:</strong>{' '}
                              {questionFeedback[currentQuestionIndex]?.summary}
                            </div>
                          )}

                          {/* Advice only if there's a next question */}
                          {currentQuestionIndex < questions.length - 1 &&
                            questionFeedback[currentQuestionIndex]?.summary && (
                              <div>
                                <strong>Advice for Next Question:</strong>{' '}
                                {
                                  questionFeedback[currentQuestionIndex]
                                    ?.advice_for_next_question
                                }
                              </div>
                            )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center mt-4 space-y-4">
                        <p className="text-sm md:text-base text-muted-foreground">
                          Fetching feedback, please wait...
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: '0%',
                              animation: 'loading-bar 5s linear forwards',
                            }}
                          ></div>
                          <style jsx>{`
                            @keyframes loading-bar {
                              from {
                                width: 0%;
                              }
                              to {
                                width: 100%;
                              }
                            }
                          `}</style>
                        </div>
                      </div>
                    )
                  ) : questionFeedback[currentQuestionIndex] ? (
                    <>
                      <div className="text-left mt-4 space-y-3">
                        <div className="text-center">
                          <strong className="block text-base">
                            Score (%):
                          </strong>
                          <p
                            className={`text-3xl font-bold mt-1 ${scoreStringColour}`}
                          >
                            {Math.round(
                              questionFeedback[currentQuestionIndex]?.mark ?? 0,
                            )}
                            /100%
                          </p>
                        </div>

                        <div>
                          <strong>Summary:</strong>{' '}
                          {questionFeedback[currentQuestionIndex]?.summary}
                        </div>

                        {/* Advice only if there's a next question */}
                        {currentQuestionIndex < questions.length - 1 && (
                          <div>
                            <strong>Advice for Next Question:</strong>{' '}
                            {
                              questionFeedback[currentQuestionIndex]
                                ?.advice_for_next_question
                            }
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-6">
                        {currentQuestionIndex < questions.length - 1 && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setCurrentQuestionIndex((prev) => prev + 1)
                            }
                          >
                            Next Question
                          </Button>
                        )}
                        <Button onClick={finishInterview}>
                          {isTutorialMode
                            ? 'Finish Tutorial'
                            : 'Finish Session'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center mt-4">
                      <p className="text-sm md:text-base text-muted-foreground">
                        Your feedback will appear here after you answer.
                      </p>
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
