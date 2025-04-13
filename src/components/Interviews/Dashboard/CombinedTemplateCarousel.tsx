'use client';

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { InterviewAnalytics } from "@/types";
import { CombinedTemplateCard } from "./CombinedTemplateCard";
import { CardDescription, CardTitle } from "@/components/ui/card";

type CombinedTemplateCarouselProps = {
    templates: InterviewAnalytics[] | null;
    onView: (id: string) => void;
};

export default function CombinedTemplateCarousel({
    templates,
    onView,
}: CombinedTemplateCarouselProps) {
    if (!templates || templates.length === 0) {
        return <div className="text-center text-gray-500 p-4">No completed sessions found.</div>;
    }

    return (
        <div className="">
            <Carousel className="w-full">
                <CarouselContent className="-ml-2">
                    {templates.map((template, index) => (
                        // Display 3 cards per slide on larger screens
                        <CarouselItem key={index} className="pl-2 md:basis-1/2 lg:basis-1/3">
                            <CombinedTemplateCard template={template} onView={onView} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    );
}
