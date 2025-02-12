'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AvgEvaluationScores } from '@/types';
import { useMemo } from 'react';
import { LabelList, PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

export type EvaluationCriteriaChartData = {
  eval_name: string;
  score: number; // using "score" instead of "avg_score" in the final chart data
  fill?: string; // each wedge can have its own color
};

export type ChartConfigType = {
  [key: string]: {
    label: string;
    color: string;
  };
};

function normalizeKey(name: string) {
  return name.toLowerCase().replace(/\s+/g, '_');
}

export function RadialChartEvaluationsScoreAverages({
  avgEvaluationCriteriaScores,
}: {
  avgEvaluationCriteriaScores: AvgEvaluationScores[];
}) {
  // 1) Build a "config" so each unique name has a consistent color
  // e.g., 'Decision Making' -> color hsl(var(--chart-1)), 'Conflict Resolution' -> chart-2, etc.
  const config = useMemo(() => {
    const newConfig: ChartConfigType = {};
    avgEvaluationCriteriaScores.forEach((item, idx) => {
      const key = normalizeKey(item.name);
      // If we already assigned a color to that name, skip reassigning
      if (!newConfig[key]) {
        // (idx % 5) + 1 ensures if we have >5 items, we cycle through chart-1..5
        newConfig[key] = {
          label: item.name,
          color: `hsl(var(--chart-${(idx % 5) + 1}))`,
        };
      }
    });
    return newConfig;
  }, [avgEvaluationCriteriaScores]);

  // 2) Create the final chart data array, attaching "fill" from the config
  const chartData: EvaluationCriteriaChartData[] = useMemo(() => {
    return avgEvaluationCriteriaScores.map((item) => {
      const key = normalizeKey(item.name);
      return {
        eval_name: item.name,
        score: item.avg_score,
        fill: config[key]?.color, // each wedge gets its color from the config
      };
    });
  }, [avgEvaluationCriteriaScores, config]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Current Average Skills</CardTitle>
        <CardDescription>Scores out of 10</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="mx-auto aspect-square max-h-[300px]"
          config={config}
        >
          {/* The chart uses chartData with each wedge having "fill" property */}
          <RadialBarChart
            className="mb-2"
            data={chartData}
            width={300}
            height={300}
            innerRadius={40}
            outerRadius={120}
            startAngle={90}
            endAngle={-270}
          >
            {/* Ensure domain = 0–10 so bars scale from 0 to 10 */}
            <PolarAngleAxis type="number" domain={[0, 10]} tick={false} />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const color = item.color ?? item.payload.fill;
                    const data = item.payload;
                    return (
                      <div className="flex items-center gap-2">
                        {/* A small color indicator */}
                        <div
                          className="h-2 w-2 "
                          style={{ backgroundColor: color }}
                        />
                        <span>
                          {data.eval_name}: {data.score.toFixed(2)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend
              verticalAlign="bottom"
              payload={chartData.map((d) => ({
                value: d.eval_name, // e.g. "Decision Making"
                color: d.fill, // wedge color
                dataKey: d.eval_name,
                type: 'square',
              }))}
            />

            <RadialBar
              dataKey="score"
              background
              cornerRadius={8}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="eval_name"
                position="insideStart"
                className="fill-gray-900 dark:fill-gray-200 capitalize mix-blend-luminosity"
                offset={8}
                style={{ fontSize: 12 }}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing average scores for your evaluation criteria
        </div>
      </CardFooter>
    </Card>
  );
  function MyManualLegend({ data }: { data: EvaluationCriteriaChartData[] }) {
    return (
      <div className="flex flex-wrap gap-3">
        {data.map((item) => (
          <div key={item.eval_name} className="flex items-center gap-1.5">
            {/* color swatch */}
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.fill }}
            />
            <span>{item.eval_name}</span>
          </div>
        ))}
      </div>
    );
  }
}
