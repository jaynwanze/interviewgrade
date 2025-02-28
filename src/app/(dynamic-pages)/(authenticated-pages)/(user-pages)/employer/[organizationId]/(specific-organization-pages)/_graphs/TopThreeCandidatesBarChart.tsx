'use client';

import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

type CandidateBarData = {
  name: string;
  score: number;
  fill?: string;
};

// Suppose you pass an array of top 3 candidates from your parent
// e.g. [ { name: "Alice", score: 92 }, { name: "Bob", score: 88 }, ... ]
export function TopThreeCandidatesBarChart({
  topCandidates,
}: {
  topCandidates: CandidateBarData[];
}) {
  // If needed, you can highlight the "best" candidate
  // by finding the highest .score's index:
  const highestIndex = topCandidates.reduce(
    (bestIdx, candidate, idx, arr) =>
      candidate.score > arr[bestIdx].score ? idx : bestIdx,
    0,
  );

  // Build a config to label "score"
  const chartConfig: ChartConfig = {
    score: {
      label: 'Score',
    },
  };

  // Then the data for Recharts. You can attach a fill color if you like
  const chartData = topCandidates.map((cand, i) => ({
    ...cand,
    fill: `var(--chart-${i + 1})`, // for a quick color approach
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Candidates</CardTitle>
        <CardDescription>
          Comparision of average scores among matched candidates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />

            {/* Show tooltip on hover */}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar
              dataKey="score"
              strokeWidth={2}
              radius={8}
              // highlight the highest bar
              activeIndex={highestIndex}
              // "activeBar" draws a custom rect for that bar
              activeBar={({ ...props }) => (
                <Rectangle
                  {...props}
                  fillOpacity={0.8}
                  stroke={props.payload.fill}
                  strokeDasharray={4}
                  strokeDashoffset={4}
                />
              )}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
