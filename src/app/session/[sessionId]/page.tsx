import { Clock3, ListChecks, Play, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SessionContext } from '@/modules/session/session.service';

import { beginPracticeSessionAction } from './actions';

type PracticeSessionPageProps = {
  params: { sessionId: string };
  searchParams?: {
    error?: string;
    started?: string;
  };
};

type SessionLoadResult =
  | { state: 'ready'; context: SessionContext }
  | { state: 'not-found' }
  | { state: 'unavailable' };

async function loadSessionContext(sessionId: string): Promise<SessionLoadResult> {
  try {
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const service = createPublicSessionService();
    const context = await service.getContext(sessionId);

    return context ? { state: 'ready', context } : { state: 'not-found' };
  } catch (error) {
    console.error('PracticeSessionPage: v2 session persistence unavailable', error);
    return { state: 'unavailable' };
  }
}

export default async function PracticeSessionPage({
  params,
  searchParams,
}: PracticeSessionPageProps) {
  const result = await loadSessionContext(params.sessionId);

  if (result.state === 'unavailable') {
    return <SessionUnavailable />;
  }

  if (result.state === 'not-found') {
    return <SessionNotFound />;
  }

  const { session, practiceVersion, responses } = result.context;
  const snapshot = practiceVersion.snapshot;
  const currentQuestion =
    snapshot.questions.find(
      (question) => question.order === session.currentQuestionOrder,
    ) ?? snapshot.questions[0];
  const beginAction = beginPracticeSessionAction.bind(null, session.id);
  const startError = searchParams?.error === 'start';

  if (session.status === 'completed') {
    return (
      <SessionStateCard
        title="Practice complete"
        description="This session has already been completed."
      />
    );
  }

  if (session.status === 'abandoned') {
    return (
      <SessionStateCard
        title="Session ended"
        description="This practice session has been abandoned."
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              InterviewGrade
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {snapshot.title}
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              {snapshot.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background px-3 py-1.5">
              Version {practiceVersion.version}
            </span>
            <span className="rounded-full border bg-background px-3 py-1.5">
              {responses.length} response{responses.length === 1 ? '' : 's'} saved
            </span>
          </div>
        </header>

        {startError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            This session could not be started. Refresh and try again.
          </div>
        )}

        {session.status === 'created' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session ready</CardTitle>
                  <CardDescription>
                    This session is pinned to the published practice version shown
                    above. Creator edits made after this point cannot change it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric
                      icon={<ListChecks className="h-4 w-4" />}
                      label="Questions"
                      value={String(snapshot.questions.length)}
                    />
                    <Metric
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Estimated time"
                      value={
                        snapshot.estimatedDurationMinutes
                          ? `${snapshot.estimatedDurationMinutes} min`
                          : 'Flexible'
                      }
                    />
                    <Metric
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Difficulty"
                      value={snapshot.difficulty ?? 'Standard'}
                    />
                  </div>

                  {snapshot.instructions && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="mb-1 text-sm font-medium">Instructions</div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {snapshot.instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <aside>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Begin when you’re ready</CardTitle>
                  <CardDescription>
                    Starting changes the session to in progress and locks your
                    progress to this version.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={beginAction}>
                    <Button type="submit" size="lg" className="w-full">
                      <Play className="mr-2 h-4 w-4" />
                      Begin practice
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-primary">
                    Question {session.currentQuestionOrder + 1} of{' '}
                    {snapshot.questions.length}
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Your current question
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  In progress
                </span>
              </div>

              {currentQuestion ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl leading-snug">
                      {currentQuestion.prompt}
                    </CardTitle>
                    {currentQuestion.guidance && (
                      <CardDescription className="text-sm leading-6">
                        {currentQuestion.guidance}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Metric
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Preparation"
                        value={
                          currentQuestion.preparationSeconds != null
                            ? `${currentQuestion.preparationSeconds}s`
                            : 'No timer'
                        }
                      />
                      <Metric
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Response"
                        value={
                          currentQuestion.responseSeconds != null
                            ? `${currentQuestion.responseSeconds}s max`
                            : 'Flexible'
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Question unavailable</CardTitle>
                    <CardDescription>
                      The current question could not be resolved from this published
                      version.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </section>

            <aside>
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Voice response</CardTitle>
                  <CardDescription>
                    This session is now running on the new v2 persistence model.
                    Recording and transcription will connect here without changing
                    the immutable session version.
                  </CardDescription>
                </CardHeader>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function SessionStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function SessionNotFound() {
  return (
    <SessionStateCard
      title="Session not found"
      description="This InterviewGrade session does not exist or is no longer available."
    />
  );
}

function SessionUnavailable() {
  return (
    <SessionStateCard
      title="Session temporarily unavailable"
      description="The new session service is not available in this environment right now."
    />
  );
}
