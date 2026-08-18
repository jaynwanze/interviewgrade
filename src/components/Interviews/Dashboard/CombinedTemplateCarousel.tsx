'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { LegacyAnalyticsOverviewItem } from '@/modules/analytics/legacy-analytics.types';
import { CombinedTemplateCard } from './CombinedTemplateCard';

type CombinedTemplateCarouselProps = {
  templates: LegacyAnalyticsOverviewItem[];
  onView: (id: string) => void;
};

export default function CombinedTemplateCarousel({
  templates,
  onView,
}: CombinedTemplateCarouselProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        No completed sessions found.
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent className="ml-2">
        {templates.map((template) => (
          <CarouselItem
            key={`${template.mode}-${template.templateId}`}
            className="pl-2 md:basis-1/2 lg:basis-1/3"
          >
            <CombinedTemplateCard template={template} onView={onView} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
