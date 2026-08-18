'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LegacyAnalyticsOverviewItem } from '@/modules/analytics/legacy-analytics.types';
import { cn } from '@/utils/cn';
import { getBadgeColor } from '@/utils/getBadgeColour';
import { ArrowRightIcon } from 'lucide-react';

type CombinedTemplateCardProps = {
  template: LegacyAnalyticsOverviewItem;
  onView: (id: string) => void;
};

export function CombinedTemplateCard({
  template,
  onView,
}: CombinedTemplateCardProps) {
  const currentScore = template.averageScore;
  const colorClass = getBadgeColor(currentScore);

  return (
    <Card className="mx-2 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="flex items-center space-x-2">
        <CardTitle className="text-lg">{template.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-between">
        {template.imageUrl && (
          <iframe
            src={template.imageUrl}
            loading="lazy"
            title={`${template.title} preview`}
          />
        )}
        <div className="space-y-2 p-3 text-center">
          <p className="text-sm text-muted-foreground">Current Grade Avg.</p>
          <Badge className={cn('rounded-md px-2 py-1 text-lg', colorClass)}>
            {Math.round(currentScore)}%
          </Badge>
          <p className="text-xs text-muted-foreground">
            {template.completedSessions} completed session
            {template.completedSessions === 1 ? '' : 's'}
          </p>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => onView(template.templateId)}
          className="mt-2 flex items-center justify-center border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-200"
        >
          View Skill
          <ArrowRightIcon className="ml-2 w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
