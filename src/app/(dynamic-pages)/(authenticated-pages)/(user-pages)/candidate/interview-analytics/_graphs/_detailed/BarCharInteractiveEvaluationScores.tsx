'use client';

import { InterviewEvaluation } from '@/types';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

export type InterviewChartData = {
  date: string;
  evaluation_scores: {
    name: string;
    score: number;
  }[];
};

const mockInterviewEvaluations = [
  {
    created_at: '2024-09-01T12:00:00Z',
    evaluation_scores: [
      { name: 'Technical Knowledge', score: 8 },
      { name: 'Problem Solving', score: 7 },
      { name: 'Communication', score: 9 },
    ],
  },
  {
    created_at: '2024-09-02T12:00:00Z',
    evaluation_scores: [
      { name: 'Technical Knowledge', score: 7 },
      { name: 'Problem Solving', score: 8 },
      { name: 'Communication', score: 8 },
    ],
  },
  {
    created_at: '2024-09-03T12:00:00Z',
    evaluation_scores: [
      { name: 'Technical Knowledge', score: 9 },
      { name: 'Problem Solving', score: 6 },
      { name: 'Communication', score: 7 },
    ],
  },
  {
    created_at: '2024-09-04T12:00:00Z',
    evaluation_scores: [
      { name: 'Technical Knowledge', score: 8 },
      { name: 'Problem Solving', score: 9 },
      { name: 'Communication', score: 8 },
    ],
  },
];

export type ChartConfigType = {
  [key: string]: {
    label: string;
    color: string;
  };
};

function aggregateDataByDate(data: InterviewChartData[]) {
  const aggregated: Record<
    string,
    { date: string; scores: Record<string, { total: number; count: number }> }
  > = {};

  data.forEach(({ date, evaluation_scores }) => {
    if (!aggregated[date]) {
      aggregated[date] = { date, scores: {} };
    }

    evaluation_scores.forEach(({ name, score }) => {
      if (!aggregated[date].scores[name]) {
        aggregated[date].scores[name] = { total: score, count: 1 };
      } else {
        aggregated[date].scores[name].total += score;
        aggregated[date].scores[name].count += 1;
      }
    });
  });

  return Object.values(aggregated).map(({ date, scores }) => {
    const averagedScores = Object.entries(scores).reduce(
      (acc, [name, { total, count }]) => {
        acc[name] = total / count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { date, ...averagedScores };
  });
}

export function BarChartInteractiveEvaluationScores({
  interviewId,
}: {
  interviewId: string;
}) {
  const [timeRange, setTimeRange] = useState('90d');
  const [InterviewEvaluations, setInterviewEvalutations] = useState<
    InterviewEvaluation[]
  >([]);

  /*
  const fetchInterviewEvaluations = async () => {
    try {
      const data = await getInterviewEvaluations(interviewId);
      setInterviewEvalutations(data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  };

  useEffect(() => {
    fetchInterviewEvaluations();
  }, [interviewId]); */

  const normalizeKey = (key: string) => key.toLowerCase().replace(/\s+/g, '_');
  const chartConfig: ChartConfigType = mockInterviewEvaluations.reduce(
    (acc, evaluation) => {
      evaluation.evaluation_scores.forEach((score, index) => {
        const normalizedKey = normalizeKey(score.name);
        acc[normalizedKey] = {
          label: score.name,
          color: `hsl(var(--chart-${index + 1})) `,
        };
      });
      return acc;
    },
    {} as ChartConfigType,
  ) satisfies ChartConfig;

  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>(
    Object.keys(chartConfig)[0],
  );

  const rawChartData: InterviewChartData[] = mockInterviewEvaluations.map(
    (evaluation) => {
      const date = new Date(evaluation.created_at).toISOString().split('T')[0];
      const scores = evaluation.evaluation_scores.map((score) => ({
        name: normalizeKey(score.name),
        score: score.score,
      }));
      return { date, evaluation_scores: scores };
    },
  );

  const [chartData, setChartData] = useState(aggregateDataByDate(rawChartData));

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
  const evaluationCriteriaString: string =
    chartConfig[activeChart].label.toLowerCase();

  return (
    <Card>
      <CardHeader className="flex flex-col items-center  space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6 overflow-auto">
          <CardTitle>Overall Evaluation Criteria Scores Progession</CardTitle>
          <CardDescription>
            Showing how overall evaluation criteria scores have progressed over
            the last {timeRangeString} for {evaluationCriteriaString}{' '}
          </CardDescription>
        </div>
        <div className="mr-5">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
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
        <div className="grid">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className=" text-centertext-xs font-bold text-muted-foreground">
                  {chartConfig[chart].label}
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
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected time range.
            </div>
          ) : (
            <BarChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickCount={5}
                tickFormatter={(value) => value}
                width={40}
                domain={[0, 10]}
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
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
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
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey={activeChart}
                fill={`var(--color-${activeChart})`}
                radius={[4, 4, 0, 0]}
              />{' '}
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
