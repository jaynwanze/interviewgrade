'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// Types for evaluation scores
interface EvaluationScore {
  id: string;
  name: string;
  score: number; // Score out of 10
  feedback: string;
}

interface Evaluation {
  evaluation_scores: EvaluationScore[];
}

interface EvaluationRadarChartProps {
  evaluation: Evaluation;
}

// Custom tick renderer that splits labels into multiple lines
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedTick = (props: any) => {
  const { payload, x, y, textAnchor, stroke } = props;
  const words = payload.value.split(' ');
  return (
    <text x={x} y={y} textAnchor={textAnchor}>
      {words.map((word: string, index: number) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : '1em'}>
          {word}
        </tspan>
      ))}
    </text>
  );
};

export function RadarChartEvaluationsCriteriaScores({
  evaluation,
}: EvaluationRadarChartProps) {
  // Transform evaluation scores into chart data.
  // Here we use the criterion name directly. The custom tick handles spaces.
  const chartData = evaluation.evaluation_scores.map((score) => ({
    criterion: score.name || 'N/A',
    score: score.score,
  }));

  const chartConfig = {
    score: {
      label: 'Score',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[270px]"
    >
      <RadarChart
        data={chartData}
        width={300}
        height={300}
        outerRadius={60}
        // Add margin around the chart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent hideLabel />}
        />
        <PolarGrid gridType="circle" />
        <PolarAngleAxis
          dataKey="criterion"
          tickSize={20}
          tick={<CustomizedTick />}
        />
        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
        <Radar
          dataKey="score"
          fill="var(--color-score)"
          fillOpacity={0.6}
          dot={{ r: 4, fillOpacity: 1 }}
        />
      </RadarChart>
    </ChartContainer>
  );
}
