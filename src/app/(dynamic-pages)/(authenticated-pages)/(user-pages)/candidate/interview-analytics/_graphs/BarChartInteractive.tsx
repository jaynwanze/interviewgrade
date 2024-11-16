'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
const chartData = [
  { date: '2024-04-01', interviews: 4 },
  { date: '2024-04-02', interviews: 2 },
  { date: '2024-04-03', interviews: 2 },
  { date: '2024-04-04', interviews: 3 },
  { date: '2024-04-05', interviews: 0 },
  { date: '2024-04-06', interviews: 3 },
  { date: '2024-04-07', interviews: 3 },
  { date: '2024-04-08', interviews: 3 },
  { date: '2024-04-09', interviews: 3 },
  { date: '2024-04-10', interviews: 3 },
  { date: '2024-04-11', interviews: 4 },
  { date: '2024-04-12', interviews: 0 },
  { date: '2024-04-13', interviews: 0 },
  { date: '2024-04-14', interviews: 2 },
  { date: '2024-04-15', interviews: 3 },
  { date: '2024-04-16', interviews: 0 },
  { date: '2024-04-17', interviews: 4 },
  { date: '2024-04-18', interviews: 3 },
  { date: '2024-04-19', interviews: 3 },
  { date: '2024-04-20', interviews: 0 },
  { date: '2024-04-21', interviews: 3 },
  { date: '2024-04-22', interviews: 0 },
  { date: '2024-04-23', interviews: 2 },
  { date: '2024-04-24', interviews: 3 },
  { date: '2024-04-25', interviews: 0 },
  { date: '2024-04-26', interviews: 0 },
  { date: '2024-04-27', interviews: 3 },
  { date: '2024-04-28', interviews: 2 },
  { date: '2024-04-29', interviews: 3 },
  { date: '2024-04-30', interviews: 2 },
  { date: '2024-05-01', interviews: 5 },
  { date: '2024-05-02', interviews: 2 },
  { date: '2024-05-03', interviews: 2 },
  { date: '2024-05-04', interviews: 1 },
  { date: '2024-05-05', interviews: 3 },
  { date: '2024-05-06', interviews: 4 },
  { date: '2024-05-07', interviews: 2 },
  { date: '2024-05-08', interviews: 5 },
  { date: '2024-05-09', interviews: 2 },
  { date: '2024-05-10', interviews: 2 },
  { date: '2024-05-11', interviews: 1 },
  { date: '2024-05-12', interviews: 2 },
  { date: '2024-05-13', interviews: 3 },
  { date: '2024-05-14', interviews: 2 },
  { date: '2024-05-15', interviews: 3 },
  { date: '2024-05-16', interviews: 3 },
  { date: '2024-05-17', interviews: 2 },
  { date: '2024-05-18', interviews: 2 },
  { date: '2024-05-19', interviews: 3 },
  { date: '2024-05-20', interviews: 2 },
  { date: '2024-05-21', interviews: 2 },
  { date: '2024-05-22', interviews: 2 },
  { date: '2024-05-23', interviews: 2 },
  { date: '2024-05-24', interviews: 2 },
  { date: '2024-05-25', interviews: 2 },
  { date: '2024-05-26', interviews: 2 },
  { date: '2024-05-27', interviews: 2 },
  { date: '2024-05-28', interviews: 2 },
  { date: '2024-05-29', interviews: 2 },
  { date: '2024-05-30', interviews: 3 },
  { date: '2024-05-31', interviews: 2 },
  { date: '2024-06-01', interviews: 2 },
  { date: '2024-06-02', interviews: 2 },
  { date: '2024-06-03', interviews: 2 },
  { date: '2024-06-04', interviews: 2 },
  { date: '2024-06-05', interviews: 2 },
  { date: '2024-06-06', interviews: 4 },
  { date: '2024-06-07', interviews: 2 },
  { date: '2024-06-08', interviews: 2 },
  { date: '2024-06-09', interviews: 3 },
  { date: '2024-06-10', interviews: 3 },
  { date: '2024-06-11', interviews: 5 },
  { date: '2024-06-12', interviews: 0 },
  { date: '2024-06-13', interviews: 0 },
  { date: '2024-06-14', interviews: 0 },
  { date: '2024-06-15', interviews: 2 },
  { date: '2024-06-16', interviews: 4 },
  { date: '2024-06-17', interviews: 3 },
  { date: '2024-06-18', interviews: 3 },
  { date: '2024-06-19', interviews: 3 },
  { date: '2024-06-20', interviews: 3 },
  { date: '2024-06-21', interviews: 3 },
  { date: '2024-06-22', interviews: 3 },
  { date: '2024-06-23', interviews: 3 },
  { date: '2024-06-24', interviews: 3 },
  { date: '2024-06-25', interviews: 3 },
  { date: '2024-06-26', interviews: 3 },
  { date: '2024-06-27', interviews: 2 },
  { date: '2024-06-28', interviews: 2 },
  { date: '2024-06-29', interviews: 2 },
  { date: '2024-06-30', interviews: 2 },
];

const chartConfig = {
  views: {
    label: 'Interviews',
  },
  interviews: {
    label: 'Interviews',
    color: 'hsl(var(--chart-1))',
  },

} satisfies ChartConfig;

export function BarChartInteractive() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('interviews');

  const total = React.useMemo(
    () => ({
      interviews: chartData.reduce((acc, curr) => acc + curr.interviews, 0),
    }),
    [],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Bar Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total Interviews for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {['interviews'].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
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
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
