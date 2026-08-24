import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  if (summary.totalSessions === 0) {
    return null;
  }

  const latestCompleted = recentSessions.find(
    (session) => session.status === 'completed',
  );

  return (
    <section className="container mx-auto w-full px-4 pt-4 sm:w-11/12 lg:w-3/4">
      <Card className="border-primary/15 bg-primary/[0.02]">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Practice Progress
              </CardTitle>
              <CardDescription className="mt-1.5">
                Track completed Practices, scores and coaching reports.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href="/candidate/interview-history">
                View history
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Completed"
              value={`${summary.completedSessions}`}
              hint={`${summary.totalSessions} total sessions`}
            />
            <MetricCard
              label="Average score"
              value={formatScore(summary.averageScore)}
              hint={`${summary.scoredSessions} scored report${summary.scoredSessions === 1 ? '' : 's'}`}
            />
            <MetricCard
              label="Best score"
              value={formatScore(summary.bestScore)}
              hint="Across completed reports"
              icon={<Trophy className="h-4 w-4" />}
            />
            <MetricCard
              label="In progress"
              value={`${summary.inProgressSessions}`}
              hint="Ready to continue"
            />
          </div>

          {latestCompleted && (
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Latest completed practice</div>
                  <div className="mt-1 break-words text-sm text-muted-foreground">
                    {latestCompleted.title}
                    {latestCompleted.overallScore != null
                      ? ` · ${Math.round(latestCompleted.overallScore)}/100`
                      : ' · report pending'}
                  </div>
                </div>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href={`/session/${latestCompleted.id}/report`}>
                  {latestCompleted.hasReport ? 'View report' : 'Generate report'}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-background p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        <span className="min-w-0 break-words">{label}</span>
        {icon}
      </div>
      <div className="mt-2 break-words text-xl font-semibold sm:text-2xl">{value}</div>
      <div className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs">
        {hint}
      </div>
    </div>
  );
}

function formatScore(score: number | null) {
  return score == null ? '—' : `${Math.round(score)}/100`;
}
