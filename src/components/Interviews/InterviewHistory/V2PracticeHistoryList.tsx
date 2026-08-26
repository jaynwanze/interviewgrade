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
  if (sessions.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">Practice sessions</h2>
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <V2PracticeHistoryItem key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}

function V2PracticeHistoryItem({ session }: { session: CandidateSessionHistoryItem }) {
  const status = statusDisplay(session.status);
  const activityDate = session.completedAt ?? session.startedAt;
  const score = session.overallScore == null ? null : Math.round(session.overallScore);

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
              {session.title}
            </h3>
            {session.status === 'completed' && score != null && (
              <div className={`shrink-0 text-lg font-bold ${scoreClass(score)}`}>
                {score}<span className="text-xs font-medium text-muted-foreground">/100</span>
              </div>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={`${status.className} border px-2 py-0 text-[11px] font-medium`}>
              {status.label}
            </Badge>
            {activityDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(activityDate)}
              </span>
            )}
            {session.status === 'completed' && score == null && <span>Report pending</span>}
          </div>
        </div>

        <SessionAction session={session} />
      </CardContent>
    </Card>
  );
}

function SessionAction({ session }: { session: CandidateSessionHistoryItem }) {
  if (session.status === 'completed') {
    return (
      <Button asChild variant={session.hasReport ? 'default' : 'outline'} size="sm" className="w-full shrink-0 sm:w-auto">
        <Link href={`/session/${session.id}/report`}>
          <FileText className="mr-1.5 h-4 w-4" />
          {session.hasReport ? 'Report' : 'Generate'}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (session.status === 'created' || session.status === 'in_progress') {
    return (
      <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
        <Link href={`/session/${session.id}`}>
          {session.status === 'created' ? <Play className="mr-1.5 h-4 w-4" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
          {session.status === 'created' ? 'Start' : 'Resume'}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" disabled>Ended</Button>;
}

function statusDisplay(status: CandidateSessionHistoryItem['status']) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' };
    case 'in_progress':
      return { label: 'In progress', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' };
    case 'created':
      return { label: 'Not started', className: 'border-border bg-muted text-muted-foreground' };
    case 'abandoned':
      return { label: 'Ended', className: 'border-destructive/30 bg-destructive/10 text-destructive' };
  }
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function scoreClass(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 65) return 'text-lime-600 dark:text-lime-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}
