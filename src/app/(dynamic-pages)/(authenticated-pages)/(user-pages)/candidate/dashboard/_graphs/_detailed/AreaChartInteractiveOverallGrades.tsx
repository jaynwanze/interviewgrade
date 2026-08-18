'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LegacyAnalyticsTrendEvaluation } from '@/modules/analytics/legacy-detailed-analytics';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export type rawDataTypeChart = {
  date: string;
  interview_grade: number;
  count: number;
}[];

const chartConfig = {
  interview_grades: {
    label: 'Interview Grades',
  },
  interview_grade: {
    label: 'Interview Grade',
    color: 'hsl(var(--chart-5))',
  },
  count: {
    label: 'Interview Count',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

function aggregateDataByDate(data: rawDataTypeChart) {
  const byDate = new Map<string, { total: number; count: number }>();

  for (const { date, interview_grade } of data) {
    const existing = byDate.get(date);
    if (existing) {
      existing.total += interview_grade;
      existing.count += 1;
    } else {
      byDate.set(date, { total: interview_grade, count: 1 });
    }
  }

  return Array.from(byDate.entries())
    .map(([date, value]) => ({
      date,
      interview_grade: value.total / value.count,
      count: value.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function AreaChartInteractiveOverallGrades({
  completedInterviewEvaluations,
}: {
  completedInterviewEvaluations: LegacyAnalyticsTrendEvaluation[];
}) {
  const [timeRange, setTimeRange] = useState('90d');
  const chartData = useMemo(
    () =>
      aggregateDataByDate(
        completedInterviewEvaluations.map((evaluation) => ({
          date: evaluation.created_at.split('T')[0],
          interview_grade: evaluation.overall_grade,
          count: 1,
        })),
      ),
    [completedInterviewEvaluations],
  );

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    now.setDate(now.getDate() - daysToSubtract);
    return date >= now;
  });

  const timeRangeString =
    timeRange === '90d' ? '3 months' : timeRange === '30d' ? '30 days' : '7 days';

  return (
    <Card className="transform transition hover:scale-105">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Overall Grade Trend</CardTitle>
          <CardDescription>
            Showing how overall grades have progressed over the last{' '}
            {timeRangeString}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[150px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="shadow rounded-lg px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected time range.
            </div>
          ) : (
            <AreaChart accessibilityLayer data={filteredData}>
              <defs>
                <linearGradient
                  id="fillInterviewGrade"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-interview_grade)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-interview_grade)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickCount={5}
                tickFormatter={(value) => value}
                width={40}
                domain={[0, 100]}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="interview_grade"
                type="linear"
                fill="url(#fillInterviewGrade)"
                stroke="var(--color-interview_grade)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
