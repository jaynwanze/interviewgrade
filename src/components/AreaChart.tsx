import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

type ChartData = {
  name: string;
  value: number;
};

const chartConfig = {
  value: {
    label: 'Time Spent',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export const AreaChartComponent = ({
  chartData,
  classname,
}: {
  chartData: ChartData[];
  classname?: string;
}) => {
  return (
    <div>
      <ChartContainer className={cn(classname)} config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 15,
            right: 15,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              value.length > 4 ? value.slice(0, 3) : value
            }
          />
          <ChartTooltip
            cursor={true}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="value"
            type="natural"
            fill="var(--color-value)"
            fillOpacity={0.4}
            stroke="var(--color-value)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
