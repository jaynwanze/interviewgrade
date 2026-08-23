import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Mail,
  Target,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  getCreatorPracticeResults,
  type CreatorPracticeResultAttempt,
} from '@/modules/practice/creator-practice-results';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import { CopyPracticeLinkButton } from '../../CopyPracticeLinkButton';

type PracticeResultsPageProps = {
  params: { practiceId: string };
};

export default async function PracticeResultsPage({
  params,
}: PracticeResultsPageProps) {
  const user = await serverGetLoggedInUser();
  const result = await getCreatorPracticeResults(params.practiceId, user.id);

  if (!result) {
    notFound();
  }

  const { analytics } = result;
  const publicPath = result.practice.shareSlug
    ? `/p/${result.practice.shareSlug}`
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/candidate/practices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My Practices
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <BarChart3 className="h-4 w-4" />
              Practice results
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {result.practice.title}
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Understand participant performance across every published version, then
              open an individual attempt for the full report.
            </p>
          </div>
        </div>

        {publicPath && (
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <CopyPracticeLinkButton path={publicPath} />
            <Button asChild variant="outline">
              <Link href={publicPath} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open share page
              </Link>
            </Button>
          </div>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<UsersRound className="h-5 w-5 text-primary" />}
          label="Attempts"
          value={String(analytics.totalAttempts)}
          detail="All sessions started from this Practice"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Completion rate"
          value={formatPercent(analytics.completionRate)}
          detail={`${analytics.completedAttempts} of ${analytics.totalAttempts} attempt${analytics.totalAttempts === 1 ? '' : 's'} completed`}
        />
        <MetricCard
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          label="Average score"
          value={formatScore(analytics.averageScore)}
          detail={evaluationCountDetail(analytics.evaluatedAttempts)}
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-primary" />}
          label="Median score"
          value={formatScore(analytics.medianScore)}
          detail="Middle score across evaluated attempts"
        />
      </section>

      {result.attempts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <UsersRound className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">No attempts yet</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Share the published Practice link. New participant sessions will appear
              here as soon as they start.
            </p>
            {publicPath && (
              <div className="mt-6 w-full max-w-xs">
                <CopyPracticeLinkButton path={publicPath} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Rubric performance
                </CardTitle>
                <CardDescription>
                  Average final score for each rubric criterion. Weakest areas appear
                  first so you can see where participants need the most support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.criterionAverages.length > 0 ? (
                  <div className="space-y-5">
                    {analytics.criterionAverages.map((criterion) => (
                      <div key={criterion.criterionName} className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium leading-5">
                              {criterion.criterionName}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {criterion.evaluatedAttempts} evaluated attempt
                              {criterion.evaluatedAttempts === 1 ? '' : 's'}
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-semibold">
                            {Math.round(criterion.averageScore)}/100
                          </div>
                        </div>
                        <Progress value={criterion.averageScore} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnalyticsEmptyState text="Rubric averages will appear after a completed attempt has a final evaluation." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score distribution</CardTitle>
                <CardDescription>
                  Evaluated attempts grouped using the same score bands as individual
                  final reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.evaluatedAttempts > 0 ? (
                  <div className="space-y-5">
                    {analytics.scoreDistribution.map((bucket) => {
                      const percent =
                        (bucket.count / analytics.evaluatedAttempts) * 100;

                      return (
                        <div key={bucket.key} className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">{bucket.label}</div>
                              <div className="text-xs text-muted-foreground">
                                Score {bucket.rangeLabel}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{bucket.count}</div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(percent)}%
                              </div>
                            </div>
                          </div>
                          <Progress value={percent} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <AnalyticsEmptyState text="Score distribution will appear after completed reports are evaluated." />
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Participant attempts</CardTitle>
              <CardDescription>
                Name and email appear only when the participant supplied them. Anonymous
                attempts remain labelled as guests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.attempts.map((attempt) => (
                <AttemptRow
                  key={attempt.sessionId}
                  practiceId={params.practiceId}
                  attempt={attempt}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          {icon}
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function AnalyticsEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function AttemptRow({
  practiceId,
  attempt,
}: {
  practiceId: string;
  attempt: CreatorPracticeResultAttempt;
}) {
  const identity = participantIdentity(attempt);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <span>{identity.label}</span>
          </div>
          <StatusBadge status={attempt.status} />
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            Version {attempt.practiceVersion}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {identity.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {identity.email}
            </span>
          )}
          <span>Started {formatDateTime(attempt.startedAt ?? attempt.createdAt)}</span>
          {attempt.completedAt && (
            <span>Completed {formatDateTime(attempt.completedAt)}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="min-w-20 text-right">
          <div className="text-xl font-semibold">
            {attempt.overallScore == null
              ? '—'
              : `${Math.round(attempt.overallScore)}/100`}
          </div>
          <div className="text-xs text-muted-foreground">
            {attempt.hasReport ? 'final score' : 'no final report'}
          </div>
        </div>

        {attempt.hasReport && (
          <Button asChild size="sm">
            <Link
              href={`/candidate/practices/${practiceId}/results/${attempt.sessionId}`}
            >
              View result
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function participantIdentity(attempt: CreatorPracticeResultAttempt) {
  if (attempt.participantName) {
    return {
      label: attempt.participantName,
      email: attempt.participantEmail,
    };
  }

  if (attempt.participantEmail) {
    return {
      label: attempt.participantEmail,
      email: null,
    };
  }

  if (attempt.participantUserId) {
    return {
      label: 'Signed-in participant',
      email: null,
    };
  }

  return {
    label: 'Guest participant',
    email: null,
  };
}

function StatusBadge({ status }: { status: CreatorPracticeResultAttempt['status'] }) {
  const label =
    status === 'completed'
      ? 'Completed'
      : status === 'in_progress'
        ? 'In progress'
        : status === 'abandoned'
          ? 'Abandoned'
          : 'Not started';
  const classes =
    status === 'completed'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : status === 'in_progress'
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
        : 'border-border bg-muted/50 text-muted-foreground';

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

function formatScore(value: number | null) {
  return value == null ? '—' : `${Math.round(value)}/100`;
}

function formatPercent(value: number | null) {
  return value == null ? '—' : `${Math.round(value)}%`;
}

function evaluationCountDetail(count: number) {
  return count > 0
    ? `Across ${count} evaluated attempt${count === 1 ? '' : 's'}`
    : 'Appears after completed reports are evaluated';
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
