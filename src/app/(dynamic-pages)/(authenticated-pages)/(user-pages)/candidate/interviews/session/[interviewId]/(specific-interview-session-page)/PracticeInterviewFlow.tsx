'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { AIQuestionSpeaker } from '@/components/Interviews/InterviewFlow/AIQuestionSpeaker';
import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNotifications } from '@/contexts/NotificationsContext';
import { markTutorialAsDoneAction } from '@/data/user/candidate';
import {
  getInterviewAnalytics,
  insertInterviewAnswer,
  updateInterview,
} from '@/data/user/interviews';
import type {
  FeedbackData,
  Interview,
  InterviewAnswerDetail,
  InterviewQuestion,
  specificFeedbackType,
} from '@/types';
import { getInterviewFeedback } from '@/utils/openai/getInterviewFeedback';
import { ChevronLeft } from 'lucide-react';

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
  // e.g. "Score (%): 45/100%"
  const scoreRegex = /Score \(%\):\s*(\d+)\s*\/\s*100%/;
  const scoreMatch = text.match(scoreRegex);
  if (scoreMatch && scoreMatch[1] !== undefined && scoreMatch[0].includes('/100%')) {
    result.mark = parseInt(scoreMatch[1], 10);
  }

  // 2) Summary
  // We'll capture everything after "Summary:" until "Advice for Next Question" (or end)
  const summaryRegex = /Summary:\s*([\s\S]+?)(?=\nAdvice for Next Question|$)/;
  const summaryMatch = text.match(summaryRegex);
  if (summaryMatch && summaryMatch[1]) {
    result.summary = summaryMatch[1].trim();
  }

  // 3) Advice
  // We'll capture everything after "Advice for Next Question:" until the end
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

  const [partialFeedback, setPartialFeedback] = useState<{
    [key: number]: string | null;
  }>({});
  const answers = useRef<string[]>([]);
  const { addNotification } = useNotifications();
  const [scoreStringColour, setScoreStringColour] = useState('');

  const router = useRouter();
  const maxScorePerQuestion = 100;
  const [partialText, setPartialText] = useState('');

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
              // e.g. "Practice Fe" or "edback\nScore ..."
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

    // const candidateProfile = await candidateProfile(interview.candidate_id);

    const interviewAnalytics = await getInterviewAnalytics(
      interview.candidate_id,
      interview.template_id,
      'practice',
    );

    // if (interviewAnalytics.current avg > candidateProfile.practice_skill_avg) {
    //   candidateProfile._prev_avg = candidateProfile.practice_skill_avg
    // update candidateProfile.practice_skill_avg = interviewAnalytics.current avg

    try {
      const feedback: FeedbackData | null = await getInterviewFeedback(
        interview,
        interview.evaluation_criterias ?? [],
        answerDetails.splice(0, currentQuestionIndex + 1),
      );

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
      <div className="flex flex-col items-center min-h-screen">
        <h1 className="mt-8 text-2xl font-bold">Practice session complete!</h1>
        <p className="mt-4">
          We are evaluating your session so please Hold tight!
        </p>
      </div>
    );
  } else if (isInterviewComplete) {
    return (
      <div className="flex flex-col items-center min-h-screen">
        <h1 className="mt-8 text-2xl font-bold">Practice session complete!</h1>
        <p className="mt-4 mb-3">
          Check your session report in the notifiction link.
        </p>
        <Button onClick={() => router.push('/candidate')}>Return Home</Button>
      </div>
    );
  }

  // Otherwise, show the main practice flow
  return (
    <div className="flex flex-col items-center min-h-screen space-y-6 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-5xl gap-6">
        {/* Leave Session Button */}
        <div className="flex justify-start">
          <Button variant="destructive" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4">Leave Session </ChevronLeft>
          </Button>
        </div>

        {/* Left Column: Interviewer (Question) */}
        <div className="flex-1 space-y-4">
          <AIQuestionSpeaker
            question={questions[currentQuestionIndex]}
            currentIndex={currentQuestionIndex}
            questionsLength={questions.length}
          />
        </div>

        {/* Right Column: Timer & Candidate Camera */}
        <div className="flex-1 space-y-4">
          <Card className="shadow-md text-center">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {Math.floor(recordingTime / 60)}:
                {('0' + (recordingTime % 60)).slice(-2)}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Candidate</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCamera
                answerCallback={handleAnswer}
                isCameraOn={isCameraOn}
                onRecordEnd={null}
                isFetchingSpecificFeedback={setIsFetchingSpecificFeedback}
                interviewMode={interview.mode}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Panel */}
      <div className="w-full max-w-2xl">
        <Card className="shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Practice Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFetchingSpecificFeedback ? (
              questionFeedback[currentQuestionIndex] ? (
                <>
                  <div className="text-left mt-4 space-y-3">
                    {questionFeedback[currentQuestionIndex]?.mark !== undefined && (
                      <div className="text-center">
                        <strong className="block text-base">Score (%):</strong>
                        <p className={`text-3xl font-bold mt-1 ${scoreStringColour}`}>
                          {Math.round(questionFeedback[currentQuestionIndex]?.mark ?? 0)}/100%
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
                      {isTutorialMode ? 'Finish Tutorial' : 'Finish Session'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <p>Fetching feedback...</p>
                  <LoadingSpinner />
                </div>
              )
            ) : questionFeedback[currentQuestionIndex] ? (
              <>
                <div className="text-left mt-4 space-y-3">
                  <div className="text-center">
                    <strong className="block text-base">Score (%):</strong>
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
                    {isTutorialMode ? 'Finish Tutorial' : 'Finish Session'}
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm md:text-base">
                After you answer, feedback will be displayed here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
