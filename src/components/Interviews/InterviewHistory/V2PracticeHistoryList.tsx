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
    <section className="w-full max-w-4xl mx-auto space-y-3">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h2 className="text-sm font-semibold">New Practice Sessions</h2>
          <p className="text-xs text-muted-foreground">
            Versioned v2 practices with structured reports.
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
    <Card className="w-full max-w-2xl mx-auto shadow-md hover:shadow-lg transition duration-200">
      <CardHeader>
        <div className="flex justify-between items-center gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">
              {session.title}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Versioned Practice
            </p>
          </div>
          <Badge className={`${status.className} text-white px-3 py-1 rounded-md text-sm`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <strong>Started At:</strong>{' '}
              {session.startedAt
                ? new Date(session.startedAt).toLocaleString()
                : 'N/A'}
            </p>
            <p>
              <strong>Completed At:</strong>{' '}
              {session.completedAt
                ? new Date(session.completedAt).toLocaleString()
                : 'N/A'}
            </p>
            {session.status === 'completed' && (
              <p>
                <strong>Score:</strong>{' '}
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
