'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-sm font-semibold">Practice sessions</h2>
          <p className="text-xs text-muted-foreground">
            Your recent attempts, progress, and structured reports.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalCount} session{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
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

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">
              {session.title}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Practice attempt</p>
          </div>
          <Badge
            className={`${status.className} rounded-md px-3 py-1 text-sm text-white`}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Started:</span>{' '}
              {session.startedAt
                ? new Date(session.startedAt).toLocaleString()
                : 'Not started'}
            </p>
            {session.completedAt && (
              <p>
                <span className="font-medium text-foreground">Completed:</span>{' '}
                {new Date(session.completedAt).toLocaleString()}
              </p>
            )}
            {session.status === 'completed' && (
              <p>
                <span className="font-medium text-foreground">Score:</span>{' '}
                {session.overallScore == null
                  ? 'Report pending'
                  : `${Math.round(session.overallScore)}/100`}
              </p>
            )}
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
      <Button asChild variant="outline">
        <Link href={`/session/${session.id}/report`}>
          {session.hasReport ? 'View Report' : 'Generate Report'}
        </Link>
      </Button>
    );
  }

  if (session.status === 'created' || session.status === 'in_progress') {
    return (
      <Button asChild>
        <Link href={`/session/${session.id}`}>
          {session.status === 'created' ? 'Start Practice' : 'Resume Practice'}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" disabled>
      Session Abandoned
    </Button>
  );
}

function statusDisplay(status: CandidateSessionHistoryItem['status']) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', className: 'bg-green-500' };
    case 'in_progress':
      return { label: 'In Progress', className: 'bg-yellow-500' };
    case 'created':
      return { label: 'Not Started', className: 'bg-gray-500' };
    case 'abandoned':
      return { label: 'Abandoned', className: 'bg-red-500' };
  }
}
