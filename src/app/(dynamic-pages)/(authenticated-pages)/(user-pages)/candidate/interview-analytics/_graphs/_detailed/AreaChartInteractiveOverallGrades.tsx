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
import {
  getCompletedInterviewsByTemplate,
  getInterviewEvaluations,
} from '@/data/user/interviews';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export type rawDataTypeChart = { date: string; interview_grade: number }[];

const chartConfig = {
  interview_grades: {
    label: 'Interview Grades',
  },
  interview_grade: {
    label: 'Interview Grade',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

// Helper function to group by date and calculate the average grade
function aggregateDataByDate(data: rawDataTypeChart) {
  const aggregated: Record<
    string,
    { date: string; interview_grade: number; count: number }
  > = {};

  data.forEach(({ date, interview_grade }) => {
    if (!aggregated[date]) {
      aggregated[date] = { date, interview_grade, count: 1 };
    } else {
      aggregated[date].interview_grade += interview_grade;
      aggregated[date].count += 1;
    }
  });

  return Object.values(aggregated).map(({ date, interview_grade, count }) => ({
    date,
    interview_grade: interview_grade / count,
  }));
}

export function AreaChartInteractiveOverallGrades({
  templateId,
}: {
  templateId: string;
}) {
  const [timeRange, setTimeRange] = useState('90d');
  let rawChartData: { date: string; interview_grade: number }[] = [];
  const [chartData, setChartData] = useState(aggregateDataByDate(rawChartData));


  const fetchInterviews = async () => {
    try {
      const user = await serverGetLoggedInUser();
      const completedInterviews = await getCompletedInterviewsByTemplate(
        user.id,
        templateId,
      );
      if (!completedInterviews) {
        return;
      }
      const completedInterviewsIds = completedInterviews.map(
        (interview) => interview.id,
      );
      const data = await getInterviewEvaluations(completedInterviewsIds);
      if (!data) {
        return;
      }
      rawChartData = data.map((interviewEval) => {
        return {
          date: interviewEval.created_at.split('T')[0],
          interview_grade: interviewEval.overall_grade,
        };
      });
      if (rawChartData.length === 0) {
        return;
      }
      setChartData(aggregateDataByDate(rawChartData));
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [templateId]);

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

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Overall Grade Progession</CardTitle>
          <CardDescription>
            Showing how overall grades have progressed over the last{' '}
            {timeRangeString}
          </CardDescription>
        </div>
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
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected time range.
            </div>
          ) : (
            <AreaChart data={filteredData}>
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
