import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Play,
  Target,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  CandidateSessionHistoryItem,
  CandidateSessionHistorySummary,
} from '@/modules/session/candidate-session-history';

export function V2CandidateProgress({
  summary,
  recentSessions,
}: {
  summary: CandidateSessionHistorySummary;
  recentSessions: CandidateSessionHistoryItem[];
}) {
  if (summary.totalSessions === 0) return null;

  const latestInProgress = recentSessions.find(
    (session) => session.status === 'in_progress',
  );
  const latestCompleted = recentSessions.find(
    (session) => session.status === 'completed',
  );

  return (
    <section className="container mx-auto w-full px-4 pt-3 sm:w-11/12 lg:w-3/4">
      {latestInProgress && (
        <Card className="border-primary/20 bg-primary/[0.035] shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Play className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Continue where you left off
                </div>
                <div className="mt-1 truncate font-semibold">{latestInProgress.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Resume your current Practice before starting something new.
                </div>
              </div>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href={`/session/${latestInProgress.id}`}>
                Continue practice
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {latestCompleted && (
        <Card className={`${latestInProgress ? 'mt-3' : ''} border-border/80 bg-card/60`}>
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recent practice
                </div>
                <div className="mt-1 truncate text-sm font-semibold">{latestCompleted.title}</div>
                <div className="text-xs text-muted-foreground">
                  {latestCompleted.overallScore != null
                    ? `${Math.round(latestCompleted.overallScore)}/100 · review what to improve next`
                    : 'Report pending'}
                </div>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
              <Link href={`/session/${latestCompleted.id}/report`}>
                {latestCompleted.hasReport ? 'Review report' : 'Generate report'}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Completed"
          value={`${summary.completedSessions}`}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Average"
          value={formatScore(summary.averageScore)}
          icon={<Target className="h-4 w-4" />}
        />
        <MetricCard
          label="Best"
          value={formatScore(summary.bestScore)}
          icon={<Trophy className="h-4 w-4" />}
        />
        <MetricCard
          label="In progress"
          value={`${summary.inProgressSessions}`}
          icon={<Clock3 className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="shrink-0 opacity-75">{icon}</span>
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function formatScore(score: number | null) {
  return score == null ? '—' : `${Math.round(score)}`;
}
