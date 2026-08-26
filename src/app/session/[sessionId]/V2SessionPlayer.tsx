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
  const [cameraOn, setCameraOn] = useState(true);
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
  const showFeedbackPanel =
    answeredCurrentQuestion || feedbackLoading || hasFeedback || showPreviousFeedback;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col gap-3 lg:h-[calc(100vh-150px)] lg:min-h-[620px] lg:max-h-[900px]">
      <div className="flex shrink-0 items-center gap-3 px-1 sm:gap-4">
        <div className="min-w-[96px]">
          <div className="text-sm font-medium text-primary">
            Question {safeIndex + 1} of {orderedQuestions.length}
          </div>
          <div className="text-xs text-muted-foreground">{responseCount} saved</div>
        </div>
        <Progress value={progress} className="h-2 flex-1" />
      </div>

      {error && (
        <div className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm">
          {error}
        </div>
      )}

      <Card className="shrink-0 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-background">
                <Lottie
                  animationData={talkingInterviewer}
                  loop
                  autoplay={false}
                  lottieRef={lottieRef}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Avery</div>
                <div className="text-xs text-muted-foreground">Interviewer</div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
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

          <div className="mx-auto mt-4 max-w-4xl text-center sm:mt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Question {safeIndex + 1}
            </div>
            <p className="mt-2 break-words text-xl font-semibold leading-7 tracking-tight sm:text-2xl sm:leading-8">
              {currentQuestion.prompt}
            </p>

            {currentQuestion.guidance && (
              <div className="mx-auto mt-2 max-w-3xl">
                <p
                  className={`text-sm leading-6 text-muted-foreground ${
                    guidanceExpanded ? '' : 'line-clamp-2'
                  }`}
                >
                  {currentQuestion.guidance}
                </p>
                {currentQuestion.guidance.length > 120 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setGuidanceExpanded((expanded) => !expanded)}
                  >
                    {guidanceExpanded ? 'Show less' : 'Show guidance'}
                  </Button>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <TimePill label="Prep" seconds={currentQuestion.preparationSeconds} />
              <TimePill label="Response" seconds={currentQuestion.responseSeconds} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-[360px] min-w-0 flex-1 flex-col overflow-hidden sm:min-h-[420px] lg:min-h-0">
        <CardContent className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 sm:p-3">
          <div className="w-full max-w-5xl">
            <UserCamera
              answerCallback={handleTranscript}
              isCameraOn={cameraOn}
              onRecordEnd={null}
              interviewMode="Practice"
              disabled={busy || speaking}
              maxRecordingSeconds={currentQuestion.responseSeconds ?? 120}
              controlsOverlay
            />
          </div>
        </CardContent>
      </Card>

      {showFeedbackPanel && (
        <Card className="shrink-0 overflow-hidden">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-semibold">
                    {answeredCurrentQuestion ? 'Response feedback' : 'Previous feedback'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {answeredCurrentQuestion
                      ? 'Your saved response is evaluated against this Practice rubric.'
                      : `Question ${previousFeedback?.questionNumber ?? safeIndex} feedback`}
                  </div>
                </div>
              </div>

              {feedback.score != null && answeredCurrentQuestion && (
                <div className={`text-2xl font-bold ${scoreClass(feedback.score)}`}>
                  {Math.round(feedback.score)}
                  <span className="text-sm font-medium text-muted-foreground">/100</span>
                </div>
              )}
            </div>

            {showPreviousFeedback && previousFeedback && !answeredCurrentQuestion && (
              <div
                className={`rounded-lg border p-3 transition-colors ${
                  previousFeedback.status === 'ready'
                    ? 'border-primary/25 bg-primary/5'
                    : 'bg-muted/15'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {previousFeedback.status === 'processing' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          Feedback processing…
                        </>
                      ) : previousFeedback.status === 'ready' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          Feedback ready
                          {previousFeedback.feedback.score != null && (
                            <span className={scoreClass(previousFeedback.feedback.score)}>
                              · {Math.round(previousFeedback.feedback.score)}/100
                            </span>
                          )}
                        </>
                      ) : (
                        'Feedback unavailable'
                      )}
                    </div>
                  </div>

                  {previousFeedback.status === 'ready' &&
                    previousFeedback.feedback.summary && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                          setPreviousFeedbackExpanded((expanded) => !expanded)
                        }
                      >
                        {previousFeedbackExpanded ? 'Hide' : 'View'}
                      </Button>
                    )}
                </div>

                {previousFeedbackExpanded && previousFeedback.feedback.summary && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {previousFeedback.feedback.summary}
                    </p>
                    {previousFeedback.feedback.advice &&
                      previousFeedback.feedback.advice !== 'N/A' && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          <span className="font-medium text-foreground">Next focus:</span>{' '}
                          {previousFeedback.feedback.advice}
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}

            {answeredCurrentQuestion &&
              (feedbackLoading && !hasFeedback ? (
                <div className="rounded-lg border bg-muted/15 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Response saved
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    Evaluating against your rubric…
                    {canMoveNext
                      ? ' You can continue now or wait for feedback.'
                      : isFinalQuestion
                        ? ' You can finish now or wait for feedback.'
                        : ''}
                  </p>
                </div>
              ) : hasFeedback ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {feedback.summary && (
                    <FeedbackBlock label="Summary" text={feedback.summary} />
                  )}
                  {nextQuestion && feedback.advice && feedback.advice !== 'N/A' && (
                    <FeedbackBlock
                      label="For the next question"
                      text={feedback.advice}
                    />
                  )}
                  {!feedback.summary && feedbackText && (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground sm:col-span-2">
                      {feedbackText}
                    </p>
                  )}
                </div>
              ) : null)}

            {(canMoveNext || (isFinalQuestion && answeredCurrentQuestion)) && (
              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-end">
                {canMoveNext ? (
                  <>
                    <Button
                      onClick={finishSession}
                      variant="ghost"
                      className="sm:order-1"
                      disabled={busy}
                    >
                      End practice
                    </Button>
                    <Button onClick={showNextQuestion} className="sm:order-2">
                      Next question
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={finishSession} disabled={busy}>
                    Finish practice
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canEndPractice &&
        !canMoveNext &&
        !(isFinalQuestion && answeredCurrentQuestion) && (
          <div className="flex shrink-0 justify-end">
            <Button
              onClick={finishSession}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
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
    <div className="rounded-lg border bg-muted/10 p-3">
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