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

import { PracticeVoiceRecorder } from './PracticeVoiceRecorder';
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

type PreviousFeedback = {
  questionOrder: number;
  questionNumber: number;
  status: 'processing' | 'ready' | 'unavailable';
  feedback: Feedback;
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
  const [previousFeedback, setPreviousFeedback] =
    useState<PreviousFeedback | null>(null);
  const [previousFeedbackExpanded, setPreviousFeedbackExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedNextOrder, setPreparedNextOrder] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [guidanceExpanded, setGuidanceExpanded] = useState(false);
  const [answeredCurrentQuestion, setAnsweredCurrentQuestion] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const lastAutoSpokenQuestionRef = useRef<string | null>(null);
  const feedbackRequestRef = useRef(0);

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
      feedbackRequestRef.current += 1;
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

    const answeredQuestion = currentQuestion;
    const answeredQuestionId = currentQuestion.id;
    const answeredQuestionNumber = safeIndex + 1;
    const followingQuestion = nextQuestion;
    const feedbackRequestId = feedbackRequestRef.current + 1;
    feedbackRequestRef.current = feedbackRequestId;

    setBusy(true);
    setFeedbackLoading(false);
    setError(null);
    setFeedbackText('');
    setFeedback({});
    setPreparedNextOrder(null);

    try {
      const saveResult = await savePracticeSessionResponseAction(sessionId, {
        questionId: answeredQuestionId,
        questionOrder: answeredQuestion.order,
        transcript,
      });

      if (!saveResult.success) {
        setError(saveResult.message);
        return;
      }

      setResponseCount((count) => count + 1);
      setAnsweredCurrentQuestion(true);

      if (followingQuestion) {
        setPreviousFeedback({
          questionOrder: answeredQuestion.order,
          questionNumber: answeredQuestionNumber,
          status: 'processing',
          feedback: {},
        });
        setPreviousFeedbackExpanded(false);
        await advancePracticeSessionAction(sessionId, followingQuestion.order);
        setPreparedNextOrder(followingQuestion.order);
      }

      setBusy(false);
      setFeedbackLoading(true);

      void streamFeedback(
        transcript,
        answeredQuestion,
        followingQuestion,
        feedbackRequestId,
      )
        .catch((feedbackError) => {
          console.error('V2SessionPlayer: feedback failed', feedbackError);
          if (followingQuestion) {
            setPreviousFeedback((previous) =>
              previous?.questionOrder === answeredQuestion.order
                ? { ...previous, status: 'unavailable' }
                : previous,
            );
          }
          if (feedbackRequestRef.current === feedbackRequestId) {
            setError(
              'Your answer was saved, but immediate feedback is temporarily unavailable.',
            );
          }
        })
        .finally(() => {
          if (feedbackRequestRef.current === feedbackRequestId) {
            setFeedbackLoading(false);
          }
        });
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
    requestId: number,
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

    const publishFeedback = () => {
      const parsedFeedback = parseFeedback(accumulated);

      if (followingQuestion) {
        setPreviousFeedback((previous) =>
          previous?.questionOrder === question.order
            ? { ...previous, feedback: parsedFeedback }
            : previous,
        );
      }

      if (feedbackRequestRef.current === requestId) {
        setFeedbackText(accumulated);
        setFeedback(parsedFeedback);
      }
    };

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
          publishFeedback();
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
        publishFeedback();
      }
    }

    const parsedFeedback = parseFeedback(accumulated);
    const feedbackUnavailable =
      feedbackStatus === 'fallback' ||
      /temporarily unavailable/i.test(parsedFeedback.summary ?? '');

    if (followingQuestion) {
      setPreviousFeedback((previous) =>
        previous?.questionOrder === question.order
          ? {
              ...previous,
              status: feedbackUnavailable ? 'unavailable' : 'ready',
              feedback: parsedFeedback,
            }
          : previous,
      );
    }

    if (feedbackUnavailable && feedbackRequestRef.current === requestId) {
      setError(
        'Your answer was saved, but the live AI feedback service is currently unavailable.',
      );
    }
  }

  function showNextQuestion() {
    if (preparedNextOrder == null) return;
    stopCurrentSpeech();
    feedbackRequestRef.current += 1;
    setCurrentQuestionOrder(preparedNextOrder);
    setPreparedNextOrder(null);
    setFeedbackText('');
    setFeedback({});
    setFeedbackLoading(false);
    setGuidanceExpanded(false);
    setAnsweredCurrentQuestion(false);
    setError(null);
  }

  async function finishSession() {
    if (busy || complete) return;

    try {
      setBusy(true);
      setError(null);
      stopCurrentSpeech();
      feedbackRequestRef.current += 1;
      await completePracticeSessionAction(sessionId);
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
            now attached to this practice version.
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
            This practice version does not contain a current question.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasFeedback = Boolean(
    feedbackText || feedback.score != null || feedback.summary || feedback.advice,
  );
  const canMoveNext = preparedNextOrder != null;
  const isFinalQuestion = nextQuestion == null;
  const canEndPractice = responseCount > 0;
  const showPreviousFeedback =
    previousFeedback != null &&
    previousFeedback.questionOrder !== currentQuestionOrder;
  const showCurrentInteraction = !answeredCurrentQuestion;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-3 flex items-center gap-3 px-1 sm:gap-4">
        <div className="min-w-[94px]">
          <div className="text-sm font-medium text-primary">
            Question {safeIndex + 1} of {orderedQuestions.length}
          </div>
          <div className="text-xs text-muted-foreground">{responseCount} saved</div>
        </div>
        <Progress value={progress} className="h-1.5 flex-1" />
        {canEndPractice && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden shrink-0 text-muted-foreground sm:inline-flex"
            onClick={finishSession}
            disabled={busy}
          >
            End practice
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm">
          {error}
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl border bg-background/80 px-4 py-5 shadow-sm sm:px-8 sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-full border bg-background/90 shadow-sm transition-all sm:h-24 sm:w-24 ${
              speaking
                ? 'border-primary/40 shadow-[0_0_36px_rgba(125,211,252,0.13)]'
                : 'border-border/80'
            }`}
            data-avery-presence
          >
            <span
              aria-hidden="true"
              className={`absolute inset-2 rounded-full border transition-colors ${
                speaking ? 'border-sky-300/35 bg-sky-400/5' : 'border-muted-foreground/15'
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute inset-[1.15rem] rounded-full border transition-colors sm:inset-[1.35rem] ${
                speaking ? 'border-sky-300/45 bg-sky-300/10' : 'border-muted-foreground/20 bg-muted/20'
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-3 w-3 rounded-full transition-colors ${
                speaking ? 'bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.75)]' : 'bg-muted-foreground/55'
              }`}
            />
            <Lottie
              animationData={talkingInterviewer}
              loop
              autoplay={false}
              lottieRef={lottieRef}
              className={`absolute inset-0 h-full w-full transition-opacity ${
                speaking ? 'opacity-100' : 'opacity-35'
              }`}
            />
          </div>
          <div className="mt-2.5 text-sm font-semibold">Avery</div>
          <div className="text-xs text-muted-foreground">
            {speaking ? 'Speaking' : 'Interviewer'}
          </div>

          <div className="mt-4 w-full max-w-[42rem] sm:mt-5">
            <p className="break-words text-lg font-semibold leading-7 tracking-tight sm:text-[1.35rem] sm:leading-7">
              {currentQuestion.prompt}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <TimePill label="Prep" seconds={currentQuestion.preparationSeconds} />
              <TimePill label="Response" seconds={currentQuestion.responseSeconds} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => void speakCurrentQuestion(false)}
                disabled={speaking || busy}
              >
                {speaking ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Listen
              </Button>
            </div>

            {currentQuestion.guidance && (
              <div className="mx-auto mt-2 max-w-2xl">
                {guidanceExpanded && (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {currentQuestion.guidance}
                  </p>
                )}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setGuidanceExpanded((expanded) => !expanded)}
                >
                  {guidanceExpanded ? 'Hide guidance' : 'Show guidance'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-5 max-w-2xl border-t pt-5 sm:mt-6 sm:pt-6">
          {showCurrentInteraction ? (
            <PracticeVoiceRecorder
              onAnswer={handleTranscript}
              disabled={busy || speaking}
              maxRecordingSeconds={currentQuestion.responseSeconds ?? 120}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-left">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">Response feedback</div>
                    <div className="text-xs text-muted-foreground">
                      Your answer is saved. Feedback appears here as it arrives.
                    </div>
                  </div>
                </div>
                {feedback.score != null && (
                  <div className={`shrink-0 text-2xl font-bold ${scoreClass(feedback.score)}`}>
                    {Math.round(feedback.score)}
                    <span className="text-sm font-medium text-muted-foreground">/100</span>
                  </div>
                )}
              </div>

              {feedbackLoading && !hasFeedback ? (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Evaluating against your rubric…
                </div>
              ) : hasFeedback ? (
                <div className="grid gap-x-6 gap-y-3 text-left sm:grid-cols-2 sm:divide-x sm:divide-border/70">
                  {feedback.summary && (
                    <FeedbackBlock label="Summary" text={feedback.summary} />
                  )}
                  {nextQuestion && feedback.advice && feedback.advice !== 'N/A' && (
                    <FeedbackBlock label="Next focus" text={feedback.advice} />
                  )}
                  {!feedback.summary && feedbackText && (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground sm:col-span-2">
                      {feedbackText}
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
                {canMoveNext ? (
                  <>
                    <Button
                      onClick={finishSession}
                      variant="ghost"
                      disabled={busy}
                    >
                      End practice
                    </Button>
                    <Button onClick={showNextQuestion}>
                      Next question
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : isFinalQuestion ? (
                  <Button onClick={finishSession} disabled={busy}>
                    Finish practice
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {showPreviousFeedback && previousFeedback && showCurrentInteraction && (
          <div className="relative z-10 mx-auto mt-4 max-w-2xl border-t pt-3">
            <div className="flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2 text-sm">
                {previousFeedback.status === 'processing' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : previousFeedback.status === 'ready' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                ) : null}
                <span className="font-medium">
                  Question {previousFeedback.questionNumber} feedback
                </span>
                {previousFeedback.feedback.score != null && (
                  <span className={scoreClass(previousFeedback.feedback.score)}>
                    · {Math.round(previousFeedback.feedback.score)}/100
                  </span>
                )}
              </div>
              {previousFeedback.status === 'ready' && previousFeedback.feedback.summary && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviousFeedbackExpanded((expanded) => !expanded)}
                >
                  {previousFeedbackExpanded ? 'Hide' : 'View'}
                </Button>
              )}
            </div>
            {previousFeedbackExpanded && previousFeedback.feedback.summary && (
              <div className="mt-2 text-left text-sm leading-6 text-muted-foreground">
                {previousFeedback.feedback.summary}
              </div>
            )}
          </div>
        )}
      </section>

      {canEndPractice && (
        <div className="mt-2 flex justify-center sm:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={finishSession}
            disabled={busy}
          >
            End practice
          </Button>
        </div>
      )}
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

function TimePill({
  label,
  seconds,
}: {
  label: string;
  seconds?: number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/15 px-2.5 py-1">
      <Clock3 className="h-3.5 w-3.5" />
      {label}: {seconds == null ? 'Flexible' : `${seconds}s`}
    </span>
  );
}

function FeedbackBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="px-1 py-1 first:sm:pr-6 last:sm:pl-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <p className="mt-1.5 text-sm leading-6 text-foreground/90">{text}</p>
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
