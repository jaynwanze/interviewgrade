'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StatCardProps = {
  icon: React.ReactNode;
  title: string;
  value: number;
  change: string;
};

export function StatCard({ icon, title, value, change }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}
