'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type {
  CandidateCriterionPerformance,
  CandidatePracticeAnalytics,
} from '@/modules/analytics/candidate-practice-analytics';

const scoreChartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function V2CandidateAnalytics({
  analytics,
}: {
  analytics: CandidatePracticeAnalytics;
}) {
  if (analytics.scoredSessions === 0) {
    return null;
  }

  return (
    <section className="container mx-auto w-full px-4 pt-4 sm:w-11/12 lg:w-3/4">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="flex h-full flex-col">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Score trend</CardTitle>
                <CardDescription className="mt-1.5">
                  Your latest {analytics.scoreTrend.length} structured Practice
                  report{analytics.scoreTrend.length === 1 ? '' : 's'}.
                </CardDescription>
              </div>
              <Momentum value={analytics.scoreChange} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
            <ChartContainer
              config={scoreChartConfig}
              className="h-full min-h-[240px] w-full aspect-auto"
            >
              <LineChart
                accessibilityLayer
                data={analytics.scoreTrend}
                margin={{ left: 0, right: 8, top: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="completedAt"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={formatShortDate}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatLongDate(String(value))}
                    />
                  }
                />
                <Line
                  dataKey="score"
                  type="monotone"
                  stroke="var(--color-score)"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg">Performance focus</CardTitle>
            <CardDescription>
              Strongest and lowest-scoring rubric areas across your reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {analytics.strongestCriterion && (
              <InsightCard
                label="Strongest area"
                criterion={analytics.strongestCriterion}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            )}
            {analytics.focusCriterion && (
              <InsightCard
                label="Focus next"
                criterion={analytics.focusCriterion}
                icon={<Target className="h-4 w-4" />}
              />
            )}

            {analytics.latestRecommendation && (
              <div className="rounded-lg border bg-muted/30 p-3.5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Latest recommendation
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm leading-5 text-muted-foreground">
                  {analytics.latestRecommendation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics.criterionPerformance.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg">Rubric performance</CardTitle>
            <CardDescription>
              Average scores only use sessions where that criterion was actually
              mapped and evaluated.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 pt-0 sm:p-6 sm:pt-0 md:grid-cols-2">
            {analytics.criterionPerformance.map((criterion) => (
              <CriterionBar key={criterion.name} criterion={criterion} />
            ))}
          </CardContent>
        </Card>
      )}

      {analytics.practicePerformance.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg">Practice performance</CardTitle>
            <CardDescription>
              Compare repeat attempts across the same stable Practice.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 sm:p-6 sm:pt-0 lg:grid-cols-2">
            {analytics.practicePerformance.map((practice) => (
              <div
                key={practice.practiceId}
                className="rounded-lg border bg-background p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="break-words font-semibold">{practice.title}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                      {practice.scoredAttempts} scored attempt
                      {practice.scoredAttempts === 1 ? '' : 's'} · latest{' '}
                      {formatLongDate(practice.latestCompletedAt)}
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="w-full justify-center sm:w-auto">
                    <Link href={`/session/${practice.latestSessionId}/report`}>
                      Report
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <SmallMetric label="Average" value={practice.averageScore} />
                  <SmallMetric label="Best" value={practice.bestScore} />
                  <SmallMetric label="Latest" value={practice.latestScore} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function Momentum({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <div className="flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        Need 2 reports
      </div>
    );
  }

  const improved = value > 0;
  const declined = value < 0;
  const Icon = improved ? TrendingUp : declined ? TrendingDown : Minus;

  return (
    <div className="flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? '+' : ''}
      {Math.round(value)} pts vs previous
    </div>
  );
}

function InsightCard({
  label,
  criterion,
  icon,
}: {
  label: string;
  criterion: CandidateCriterionPerformance;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {icon}
            {label}
          </div>
          <div className="mt-1.5 break-words font-semibold">{criterion.name}</div>
        </div>
        <div className="shrink-0 text-2xl font-semibold">
          {Math.round(criterion.averageScore)}
        </div>
      </div>
      <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {criterion.evidenceCount} scored response
        {criterion.evidenceCount === 1 ? '' : 's'}
        {criterion.change == null
          ? ''
          : ` · ${criterion.change > 0 ? '+' : ''}${Math.round(criterion.change)} pts latest`}
      </div>
    </div>
  );
}

function CriterionBar({
  criterion,
}: {
  criterion: CandidateCriterionPerformance;
}) {
  const width = Math.max(0, Math.min(100, criterion.averageScore));

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words text-sm font-semibold">{criterion.name}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {criterion.evidenceCount} evaluation
            {criterion.evidenceCount === 1 ? '' : 's'}
            {criterion.change == null
              ? ''
              : ` · latest ${criterion.change > 0 ? '+' : ''}${Math.round(criterion.change)} pts`}
          </div>
        </div>
        <div className="shrink-0 text-lg font-semibold">
          {Math.round(criterion.averageScore)}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-1.5 py-3 sm:px-2">
      <div className="text-lg font-semibold">{Math.round(value)}</div>
      <div className="mt-0.5 break-words text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {label}
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
