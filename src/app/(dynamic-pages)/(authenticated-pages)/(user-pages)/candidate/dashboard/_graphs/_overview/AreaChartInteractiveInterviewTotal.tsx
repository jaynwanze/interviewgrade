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
import { Interview } from '@/types';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig: ChartConfig = {
  practice: {
    label: 'Practice Sessions',
    color: `hsl(var(--chart-2))`,
  },
  interview: {
    label: 'Interview Sessions',
    color: `hsl(var(--chart-1))`,
  },
} satisfies ChartConfig;

function aggregateInterviewsByDateAndMode(
  interviews: Interview[],
): { date: string; interview: number; practice: number }[] {
  const aggregated: Record<string, { interview: number; practice: number }> =
    {};

  interviews.forEach((interview) => {
    const date = new Date(interview.created_at).toISOString().split('T')[0];
    if (!aggregated[date]) {
      aggregated[date] = { interview: 0, practice: 0 };
    }

    if (interview.mode === 'interview') {
      aggregated[date].interview += 1;
    } else if (interview.mode === 'practice') {
      aggregated[date].practice += 1;
    }
  });

  // Convert the aggregated data into an array sorted by date
  const aggregatedArray = Object.entries(aggregated)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return aggregatedArray;
}

export function AreaChartInteractiveInterviewTotal({
  interviewsCompleted,
}: {
  interviewsCompleted: Interview[];
}) {
  const [timeRange, setTimeRange] = useState('90d');
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>('');

  if (!interviewsCompleted || interviewsCompleted.length === 0) {
    return (
      <Card className="shadow rounded-lg p-6 flex flex-col justify-center items-center h-full space-y-4 mb-5">
        <p className="text-gray-500 text-lg text-center">
          No interviews completed data available at this time.
        </p>
      </Card>
    );
  }
  const chartData = React.useMemo(() => {
    return aggregateInterviewsByDateAndMode(interviewsCompleted);
  }, [interviewsCompleted]);

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

  let timeRangeString: string;
  if (timeRange === '90d') {
    timeRangeString = '3 months';
  } else if (timeRange === '30d') {
    timeRangeString = '30 days';
  } else {
    timeRangeString = '7 days';
  }

  useEffect(() => {
    const keys = Object.keys(chartConfig);
    if (keys.length > 0) {
      setActiveChart(keys[0]);
    } else {
      setActiveChart('');
    }
  }, [chartConfig]);

  return (
    <Card className="shadow-lg rounded-lg h-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6 overflow-auto">
          <CardTitle>Overall Interviews Progression</CardTitle>
          <CardDescription>
            Total interviews in the last {timeRangeString}
          </CardDescription>
        </div>

        <div className="grid">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 "
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-center text-xs font-bold text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
              </button>
            );
          })}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="mt-4 w-[160px] rounded-lg sm:ml-auto"
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
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[150px] w-full"
        >
          {filteredData.length === 0 ||
          filteredData.filter((data) => data[activeChart] > 0).length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected time range.
            </div>
          ) : (
            <AreaChart accessibilityLayer data={filteredData}>
              <defs>
                <linearGradient id="fillInterview" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${activeChart})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${activeChart})`}
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
                dataKey={activeChart}
                type="natural"
                fill="url(#fillInterview)"
                stroke={`var(--color-${activeChart})`}
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
