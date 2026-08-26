import Link from 'next/link';
import { ArrowRight, CheckCircle2, Trophy } from 'lucide-react';

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

  const latestCompleted = recentSessions.find(
    (session) => session.status === 'completed',
  );

  return (
    <section className="container mx-auto w-full px-4 pt-3 sm:w-11/12 lg:w-3/4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Completed" value={`${summary.completedSessions}`} />
        <MetricCard label="Average" value={formatScore(summary.averageScore)} />
        <MetricCard
          label="Best"
          value={formatScore(summary.bestScore)}
          icon={<Trophy className="h-4 w-4" />}
        />
        <MetricCard label="In progress" value={`${summary.inProgressSessions}`} />
      </div>

      {latestCompleted && (
        <Card className="mt-3 border-primary/15 bg-primary/[0.02]">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{latestCompleted.title}</div>
                <div className="text-xs text-muted-foreground">
                  Latest completed
                  {latestCompleted.overallScore != null
                    ? ` · ${Math.round(latestCompleted.overallScore)}/100`
                    : ' · report pending'}
                </div>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
              <Link href={`/session/${latestCompleted.id}/report`}>
                {latestCompleted.hasReport ? 'Report' : 'Generate report'}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
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
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function formatScore(score: number | null) {
  return score == null ? '—' : `${Math.round(score)}`;
}
