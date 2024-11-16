'use client';

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts';

import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { AvgEvaluationScores } from '@/types';
const chartData = [
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function RadialChart({
  avgEvaluationCriteria,
}: {
  avgEvaluationCriteria: AvgEvaluationScores[];
}) {
  const maxScore = 10.0;
  const maxAngle = 360; 
  const startAngle = 0; 

  // Example overall score
  const overallScore = parseFloat(avgEvaluationCriteria[0].avg_score.toFixed(2)); // Assume this comes dynamically

  // Calculate end angle
  const endAngle = (overallScore / maxScore) * maxAngle;
  return (
    <div>
      <h3 className="text font-semibold text-center min-h">
        {avgEvaluationCriteria[0].name}
      </h3>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
      >
        <RadialBarChart
          data={chartData}
          compact={true}
          width={150}
          height={150}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={35}
          outerRadius={60}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[40, 30]}
          />
          <RadialBar dataKey="visitors" background cornerRadius={10} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-lg font-bold" // Reduced from text-4xl to text-lg
                      >
                        {avgEvaluationCriteria[0].avg_score.toFixed(2)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 16} // Reduced spacing
                        className="fill-muted-foreground text-sm" // Reduced text size
                      >
                        Score
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}
