'use client';

import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

export default function RadialProgressCard({
    value,
    label,
    color = 'hsl(var(--chart-2))',
    title = 'Skill Progress',
    subtitle = '',
}:
    {
        value: number;
        label: string;
        color?: string;
        title?: string;
        subtitle?: string;
    }) {
    const chartData = [{ key: label, skills: value, fill: color }];

    const chartConfig = {
        skills: { label: 'Score' },
        [label]: { label, color },
    } satisfies ChartConfig;

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>{title}</CardTitle>
                {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[200px]"
                >
                    <RadialBarChart
                        data={chartData}
                        startAngle={0}
                        endAngle={250}
                        innerRadius={80}
                        outerRadius={120}
                    >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[88, 72]}
                        />
                        <RadialBar dataKey="skills" background cornerRadius={10} />
                        <PolarRadiusAxis tick={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (!viewBox || !('cx' in viewBox)) return null;
                                    const { cx, cy } = viewBox as { cx: number; cy: number };

                                    return (
                                        <text
                                            x={cx}
                                            y={cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan className="fill-foreground text-4xl font-bold">
                                                {value.toFixed(0)}%
                                            </tspan>
                                            <tspan
                                                x={cx}
                                                y={cy + 24}
                                                className="fill-muted-foreground text-sm"
                                            >
                                                {label}
                                            </tspan>
                                        </text>
                                    );
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
