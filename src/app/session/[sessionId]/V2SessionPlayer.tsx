'use client';

import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import talkingInterviewer from 'public/assets/animations/AnimationSpeakingRings.json';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  MessageSquare,
  Volume2,
} from 'lucide-react';

import { UserCamera } from '@/components/Interviews/InterviewFlow/UserCamera';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type {
  PracticeQuestion,
  RubricCriterion,
} from '@/modules/practice/practice.schema';
import {
  speakWithBrowserVoice,
  stopBrowserVoice,
} from '@/utils/openai/clientSpeechFallback';
import { generateTTS, releaseTTSUrl } from '@/utils/openai/textToSpeech';

import {
  advancePracticeSessionAction,
  completePracticeSessionAction,
  savePracticeSessionResponseAction,
} from './actions';

type Feedback = {
  score?: number;
  summary?: string;
  advice?: string;
};

type V2SessionPlayerProps = {
  sessionId: string;
  practiceTitle: string;
  scenario: string;
  initialQuestionOrder: number;
  initialResponseCount: number;
  questions: PracticeQuestion[];
  rubricCriteria: RubricCriterion[];
};

export function V2SessionPlayer({
  sessionId,
  practiceTitle,
  scenario,
  initialQuestionOrder,
  initialResponseCount,
  questions,
  rubricCriteria,
}: V2SessionPlayerProps) {
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState(
    initialQuestionOrder,
  );
  const [responseCount, setResponseCount] = useState(initialResponseCount);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedback, setFeedback] = useState<Feedback>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedNextOrder, setPreparedNextOrder] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const lastAutoSpokenQuestionRef = useRef<string | null>(null);

  const orderedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions],
  );
  const currentIndex = orderedQuestions.findIndex(
    (question) => question.order === currentQuestionOrder,
  );
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentQuestion = orderedQuestions[safeIndex];
  const nextQuestion = orderedQuestions[safeIndex + 1] ?? null;
  const progress = orderedQuestions.length
    ? ((safeIndex + 1) / orderedQuestions.length) * 100
    : 0;

  const stopCurrentSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    releaseTTSUrl(audioUrlRef.current);
    audioUrlRef.current = null;
    stopBrowserVoice();
    setSpeaking(false);
  }, []);

  const speakCurrentQuestion = useCallback(
    async (automatic = false) => {
      if (!currentQuestion) return;

      stopCurrentSpeech();
      setError(null);

      const intro =
        safeIndex === 0
          ? "Welcome to your InterviewGrade practice session. Answer each question naturally, then review your feedback. Let's begin. "
          : '';
      const speechText = `${intro}Question ${safeIndex + 1}. ${currentQuestion.prompt}`;
      let fallbackStarted = false;

      const startBrowserFallback = () => {
        if (fallbackStarted) return true;
        fallbackStarted = true;

        const started = speakWithBrowserVoice(
          speechText,
          () => setSpeaking(true),
          () => setSpeaking(false),
        );

        if (!started) {
          setSpeaking(false);
          setError(
            automatic
              ? 'Automatic question audio could not play. Click Listen to hear the question.'
              : 'The question audio could not be played. You can continue normally.',
          );
        }

        return started;
      };

      try {
        const audioUrl = await generateTTS(speechText, 'tts-1', 'alloy');
        audioUrlRef.current = audioUrl;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeaking(false);
          releaseTTSUrl(audioUrlRef.current);
          audioUrlRef.current = null;
          audioRef.current = null;
        };
        audio.onerror = () => {
          console.warn('OpenAI TTS audio playback failed; using browser voice.');
          releaseTTSUrl(audioUrlRef.current);
          audioUrlRef.current = null;
          audioRef.current = null;
          startBrowserFallback();
        };

        setSpeaking(true);
        await audio.play();
      } catch (cause) {
        console.warn(
          'V2SessionPlayer: OpenAI TTS unavailable; using browser voice fallback',
          cause,
        );
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        releaseTTSUrl(audioUrlRef.current);
        audioUrlRef.current = null;
        setSpeaking(false);
        startBrowserFallback();
      }
    },
    [currentQuestion, safeIndex, stopCurrentSpeech],
  );

  useEffect(() => {
    if (!lottieRef.current) return;

    if (speaking) {
      lottieRef.current.setSpeed(1);
      lottieRef.current.play();
    } else {
      lottieRef.current.stop();
    }
  }, [speaking]);

  useEffect(() => {
    if (!currentQuestion) return;

    const questionKey = currentQuestion.id ?? `order-${currentQuestion.order}`;
    if (lastAutoSpokenQuestionRef.current === questionKey) return;

    lastAutoSpokenQuestionRef.current = questionKey;
    void speakCurrentQuestion(true);
  }, [currentQuestion, speakCurrentQuestion]);

  useEffect(
    () => () => {
      stopCurrentSpeech();
    },
    [stopCurrentSpeech],
  );

  async function handleTranscript(transcript: string) {
    if (busy) return;

    if (!transcript.trim()) {
      setError('No speech was detected. Record your answer again.');
      return;
    }

    if (!currentQuestion?.id) {
      setError('This published question is missing its runtime identifier.');
      return;
    }

    setBusy(true);
    setError(null);
    setFeedbackText('');
    setFeedback({});
    setPreparedNextOrder(null);

    try {
      // Preserve the proven Practice ordering:
      // 1. persist response
      // 2. fetch immediate feedback
      // 3. persist next-question progress
      const saveResult = await savePracticeSessionResponseAction(sessionId, {
        questionId: currentQuestion.id,
        questionOrder: currentQuestion.order,
        transcript,
      });

      if (!saveResult.success) {
        setError(saveResult.message);
        return;
      }

      setResponseCount((count) => count + 1);

      try {
        await streamFeedback(transcript, currentQuestion, nextQuestion);
      } catch (feedbackError) {
        console.error('V2SessionPlayer: feedback failed', feedbackError);
        setError(
          'Your answer was saved, but immediate feedback is temporarily unavailable.',
        );
      }

      if (nextQuestion) {
        await advancePracticeSessionAction(sessionId, nextQuestion.order);
        setPreparedNextOrder(nextQuestion.order);
      }
    } catch (cause) {
      console.error('V2SessionPlayer: response flow failed', cause);
      setError('Your response could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function streamFeedback(
    transcript: string,
    question: PracticeQuestion,
    followingQuestion: PracticeQuestion | null,
  ) {
    const mappedRubric = rubricForQuestion(question, rubricCriteria);
    const response = await fetch('/api/v2/practice-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        practiceTitle,
        scenario,
        currentQuestion: {
          prompt: question.prompt,
          guidance: question.guidance ?? null,
        },
        currentAnswer: transcript,
        nextQuestion: followingQuestion
          ? { prompt: followingQuestion.prompt }
          : null,
        rubricCriteria: mappedRubric.map((criterion) => ({
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
        })),
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Feedback API returned ${response.status}.`);
    }

    const feedbackStatus = response.headers.get(
      'X-InterviewGrade-Feedback-Status',
    );
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulated = '';
    let buffer = '';

    let streamComplete = false;
    while (!streamComplete) {
      const { value, done } = await reader.read();
      if (done) {
        streamComplete = true;
        continue;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const dataLine = event
          .split('\n')
          .find((line) => line.startsWith('data: '));
        if (!dataLine) continue;

        const data = dataLine.slice(6);
        if (data === '[DONE]') continue;

        try {
          const delta = JSON.parse(data) as string;
          accumulated += delta;
          setFeedbackText(accumulated);
          setFeedback(parseFeedback(accumulated));
        } catch (cause) {
          console.error('V2SessionPlayer: feedback SSE parse failed', cause);
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data && data !== '[DONE]') {
        const delta = JSON.parse(data) as string;
        accumulated += delta;
        setFeedbackText(accumulated);
        setFeedback(parseFeedback(accumulated));
      }
    }

    if (feedbackStatus === 'fallback') {
      setError(
        'Your answer was saved, but the live AI feedback service is currently unavailable.',
      );
    }
  }

  function showNextQuestion() {
    if (preparedNextOrder == null) return;
    stopCurrentSpeech();
    setCurrentQuestionOrder(preparedNextOrder);
    setPreparedNextOrder(null);
    setFeedbackText('');
    setFeedback({});
    setError(null);
  }

  async function finishSession() {
    if (busy || complete) return;

    try {
      setBusy(true);
      setError(null);
      stopCurrentSpeech();
      await completePracticeSessionAction(sessionId);
      setCameraOn(false);
      setComplete(true);
    } catch (cause) {
      console.error('V2SessionPlayer: completion failed', cause);
      setError('The session could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <Card className="mx-auto max-w-2xl text-center shadow-md">
        <CardHeader>
          <div className="mx-auto mb-2 rounded-full bg-emerald-500/10 p-3 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Practice complete</CardTitle>
          <CardDescription>
            Your {responseCount} saved response{responseCount === 1 ? '' : 's'} are
            now attached to this immutable practice version.
          </CardDescription>
        </CardHeader>
        {feedback.summary && (
          <CardContent>
            <div className="rounded-lg border bg-muted/20 p-4 text-left text-sm">
              <div className="font-medium">Final question feedback</div>
              <p className="mt-2 text-muted-foreground">{feedback.summary}</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Question unavailable</CardTitle>
          <CardDescription>
            This immutable practice version does not contain a current question.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasFeedback = Boolean(
    feedbackText || feedback.score != null || feedback.summary || feedback.advice,
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <div className="text-sm font-medium text-primary">
            Question {safeIndex + 1} of {orderedQuestions.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {responseCount} response{responseCount === 1 ? '' : 's'} saved
          </div>
        </div>
        <div className="w-full sm:max-w-xs">
          <Progress value={progress} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="flex min-h-0 flex-col overflow-hidden lg:min-h-[520px]">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Interviewer</CardTitle>
                <CardDescription>Avery</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                onClick={() => void speakCurrentQuestion(false)}
                disabled={speaking || busy}
              >
                {speaking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="mr-2 h-4 w-4" />
                )}
                Listen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center space-y-4 p-4 sm:space-y-5 sm:p-6">
            <div className="mx-auto w-full max-w-[280px] overflow-hidden">
              <Lottie
                animationData={talkingInterviewer}
                loop
                autoplay={false}
                lottieRef={lottieRef}
                className="h-[112px] w-full sm:h-[160px]"
              />
            </div>
            <div className="space-y-3 text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Question {safeIndex + 1}
              </div>
              <p className="break-words text-lg font-semibold leading-7 sm:text-xl sm:leading-8">
                {currentQuestion.prompt}
              </p>
              {currentQuestion.guidance && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {currentQuestion.guidance}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <TimeMetric
                label="Preparation"
                seconds={currentQuestion.preparationSeconds}
              />
              <TimeMetric
                label="Response max"
                seconds={currentQuestion.responseSeconds}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden lg:min-h-[520px]">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">You</CardTitle>
            <CardDescription>
              Record naturally. InterviewGrade transcribes your response when you
              stop.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center p-3 sm:p-4">
            <UserCamera
              answerCallback={handleTranscript}
              isCameraOn={cameraOn}
              onRecordEnd={null}
              interviewMode="Practice"
              disabled={busy}
              maxRecordingSeconds={currentQuestion.responseSeconds ?? 120}
            />
          </CardContent>
        </Card>

        <Card className="flex min-h-0 scroll-mt-4 flex-col overflow-hidden lg:min-h-[520px]">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Practice feedback</CardTitle>
            </div>
            <CardDescription>
              Your answer is saved before feedback or question progress changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center p-4 sm:p-5">
            {busy && !hasFeedback ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center sm:py-0">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Saving your answer and preparing feedback…
                </p>
              </div>
            ) : hasFeedback ? (
              <div className="space-y-5">
                {feedback.score != null && (
                  <div className="text-center">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Score
                    </div>
                    <div
                      className={`mt-1 text-4xl font-bold ${scoreClass(feedback.score)}`}
                    >
                      {Math.round(feedback.score)}/100
                    </div>
                  </div>
                )}

                {feedback.summary && (
                  <FeedbackBlock label="Summary" text={feedback.summary} />
                )}

                {nextQuestion && feedback.advice && feedback.advice !== 'N/A' && (
                  <FeedbackBlock label="Advice for next question" text={feedback.advice} />
                )}

                {!feedback.summary && feedbackText && (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {feedbackText}
                  </p>
                )}

                {!busy && (
                  <div className="grid gap-2 border-t pt-4">
                    {preparedNextOrder != null && (
                      <Button
                        onClick={showNextQuestion}
                        variant="secondary"
                        className="min-h-11"
                      >
                        Next question
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    <Button onClick={finishSession} className="min-h-11">
                      {nextQuestion ? 'Finish session' : 'Finish practice'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center sm:py-0">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Your feedback will appear here after you record an answer.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function rubricForQuestion(
  question: PracticeQuestion,
  rubricCriteria: RubricCriterion[],
): RubricCriterion[] {
  const mappedIds = question.rubricCriterionIds;
  if (!mappedIds || mappedIds.length === 0) return rubricCriteria;

  const rubricById = new Map(
    rubricCriteria.map((criterion) => [criterion.id, criterion] as const),
  );
  const mapped = mappedIds
    .map((criterionId) => rubricById.get(criterionId))
    .filter((criterion): criterion is RubricCriterion => Boolean(criterion));

  return mapped.length > 0 ? mapped : rubricCriteria;
}

function TimeMetric({
  label,
  seconds,
}: {
  label: string;
  seconds?: number | null;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-semibold">
        {seconds == null ? 'Flexible' : `${seconds}s`}
      </div>
    </div>
  );
}

function FeedbackBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{label}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function parseFeedback(text: string): Feedback {
  const scoreMatch = text.match(/Score \(%\):\s*(?:\n\s*)?(\d+)\s*\/\s*100%/i);
  const summaryMatch = text.match(
    /Summary:\s*([\s\S]+?)(?=\n\s*Advice for Next Question:|$)/i,
  );
  const adviceMatch = text.match(/Advice for Next Question:\s*([\s\S]+)$/i);

  return {
    score: scoreMatch?.[1] ? Number(scoreMatch[1]) : undefined,
    summary: summaryMatch?.[1]?.trim(),
    advice: adviceMatch?.[1]?.trim(),
  };
}

function scoreClass(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 60) return 'text-lime-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}