import Link from 'next/link';
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
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

import { V2SessionPlayer } from './V2SessionPlayer';
import { beginPracticeSessionAction } from './actions';
import styles from './session-player-shell.module.css';

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
    const loggedInUser = await serverGetOptionalLoggedInUser();
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const service = createPublicSessionService();
    const context = await service.getAccessibleContext(
      sessionId,
      loggedInUser?.id ?? null,
    );

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
  const beginAction = beginPracticeSessionAction.bind(null, session.id);
  const startError = searchParams?.error === 'start';

  if (session.status === 'completed') {
    return (
      <SessionStateCard
        title="Practice complete"
        description={`This session has been completed with ${responses.length} saved response${responses.length === 1 ? '' : 's'}.`}
        href={`/session/${session.id}/report`}
        action="View final report"
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

  const sessionStarted = session.status !== 'created';

  return (
    <main
      className={`bg-gradient-to-b from-background via-background to-muted/30 ${
        sessionStarted
          ? 'h-[calc(100dvh-3.5rem)] overflow-hidden px-3 py-3 sm:px-5 sm:py-4'
          : 'min-h-screen px-4 py-5 sm:px-6 sm:py-6'
      }`}
    >
      <div
        className={`mx-auto w-full max-w-[1440px] ${
          sessionStarted ? 'flex h-full min-h-0 flex-col gap-3' : 'space-y-5'
        }`}
      >
        {sessionStarted ? (
          <header className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span className="shrink-0 text-sm font-medium text-primary">
                InterviewGrade
              </span>
              <span className="text-muted-foreground">/</span>
              <h1 className="truncate text-sm font-medium text-foreground">
                {snapshot.title}
              </h1>
            </div>

            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
              Version {practiceVersion.version}
            </span>
          </header>
        ) : (
          <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                InterviewGrade
              </div>
              <h1 className="line-clamp-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {snapshot.title}
              </h1>
              <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {snapshot.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border bg-background px-3 py-1.5">
                Version {practiceVersion.version}
              </span>
              <span className="rounded-full border bg-background px-3 py-1.5">
                {responses.length} response{responses.length === 1 ? '' : 's'} saved
              </span>
            </div>
          </header>
        )}

        {startError && !sessionStarted && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            This session could not be started. Refresh and try again.
          </div>
        )}

        {session.status === 'created' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <section className="order-2 space-y-6 lg:order-1">
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

            <aside className="order-1 lg:order-2 lg:sticky lg:top-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Begin when you’re ready</CardTitle>
                  <CardDescription>
                    Starting begins your Practice. Your microphone is used to capture
                    each response and transcribe it for feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={beginAction}>
                    <Button type="submit" size="lg" className="min-h-11 w-full">
                      <Play className="mr-2 h-4 w-4" />
                      Begin practice
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </aside>
          </div>
        ) : (
          <div className={styles.shell}>
            <V2SessionPlayer
              sessionId={session.id}
              practiceTitle={snapshot.title}
              scenario={snapshot.scenario}
              initialQuestionOrder={session.currentQuestionOrder}
              initialResponseCount={responses.length}
              questions={snapshot.questions}
              rubricCriteria={snapshot.rubricCriteria}
            />
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
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {href && action && (
          <CardContent>
            <Button asChild className="w-full sm:w-auto">
              <Link href={href}>{action}</Link>
            </Button>
          </CardContent>
        )}
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
      description="Practice sessions are temporarily unavailable. Refresh and try again."
    />
  );
}
