'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, FileText, Play, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CandidateSessionHistoryItem } from '@/modules/session/candidate-session-history';

export function V2PracticeHistoryList({
  sessions,
  totalCount = sessions.length,
}: {
  sessions: CandidateSessionHistoryItem[];
  totalCount?: number;
}) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-3">
      <div className="flex items-center justify-between gap-4 px-1">
        <h2 className="text-sm font-semibold">Practice sessions</h2>
        <span className="text-xs text-muted-foreground">
          {totalCount} session{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2.5">
        {sessions.map((session) => (
          <V2PracticeHistoryItem key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}

function V2PracticeHistoryItem({
  session,
}: {
  session: CandidateSessionHistoryItem;
}) {
  const status = statusDisplay(session.status);
  const activityDate = session.completedAt ?? session.startedAt;
  const score = session.overallScore == null ? null : Math.round(session.overallScore);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className={`${status.className} border px-2.5 py-0.5 text-xs font-medium`}>
                {status.label}
              </Badge>
              {activityDate && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(activityDate)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <h3 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
                {session.title}
              </h3>

              {session.status === 'completed' && (
                <div className="shrink-0 sm:text-right">
                  {score == null ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      Report pending
                    </span>
                  ) : (
                    <div className={`text-xl font-bold ${scoreClass(score)}`}>
                      {score}
                      <span className="text-sm font-medium text-muted-foreground">/100</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {session.status === 'completed'
                ? session.hasReport
                  ? 'Evaluation ready'
                  : 'Responses complete · report not generated yet'
                : session.status === 'in_progress'
                  ? 'Continue where you left off'
                  : session.status === 'created'
                    ? 'Ready to start'
                    : 'This session was ended before completion'}
            </p>
          </div>

          <SessionAction session={session} />
        </div>
      </CardContent>
    </Card>
  );
}

function SessionAction({ session }: { session: CandidateSessionHistoryItem }) {
  if (session.status === 'completed') {
    return (
      <Button
        asChild
        variant={session.hasReport ? 'default' : 'outline'}
        className="w-full shrink-0 sm:w-auto"
      >
        <Link href={`/session/${session.id}/report`}>
          <FileText className="mr-2 h-4 w-4" />
          {session.hasReport ? 'View report' : 'Generate report'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (session.status === 'created' || session.status === 'in_progress') {
    return (
      <Button asChild className="w-full shrink-0 sm:w-auto">
        <Link href={`/session/${session.id}`}>
          {session.status === 'created' ? (
            <Play className="mr-2 h-4 w-4" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          {session.status === 'created' ? 'Start' : 'Resume'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full shrink-0 sm:w-auto" disabled>
      Ended
    </Button>
  );
}

function statusDisplay(status: CandidateSessionHistoryItem['status']) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        className:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      };
    case 'in_progress':
      return {
        label: 'In progress',
        className:
          'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      };
    case 'created':
      return {
        label: 'Not started',
        className: 'border-border bg-muted text-muted-foreground',
      };
    case 'abandoned':
      return {
        label: 'Ended',
        className: 'border-destructive/30 bg-destructive/10 text-destructive',
      };
  }
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function scoreClass(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 65) return 'text-lime-600 dark:text-lime-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}
