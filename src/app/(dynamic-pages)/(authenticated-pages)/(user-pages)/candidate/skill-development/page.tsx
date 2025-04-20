'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useSkillBuilder } from '@/hooks/useSkillBuilder';
import {
  getBadgeColor,
  getProgressBarColor,
  getStatus,
} from '@/utils/getBadgeColour';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function SkillBuilderPage() {
  const [activeSwitch, setActiveSwitch] = useState<
    'Practice Mode' | 'Interview Mode'
  >('Practice Mode');

  const { bundles, isLoading, error, fetchData, mode } = useSkillBuilder();

  useEffect(() => {
    const nextMode =
      activeSwitch === 'Practice Mode' ? 'practice' : 'interview';
    fetchData(nextMode);
  }, [activeSwitch]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4">
      <div>
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Skill Development</h1>
          <p className="text-muted-foreground">
            Personalised insights &amp; learning resources
          </p>
        </header>
        <Separator className="my-4" />
      </div>
      <div className="flex items-center justify-end mb-4 gap-2">
        <Switch
          checked={activeSwitch === 'Interview Mode'}
          onCheckedChange={() =>
            setActiveSwitch(
              activeSwitch === 'Practice Mode'
                ? 'Interview Mode'
                : 'Practice Mode',
            )
          }
        />
        <Label>{activeSwitch}</Label>
      </div>
      {bundles === null || bundles.length === 0 ? (
        <>
          <div className="flex flex-col items-center justify-center ">
            <p className="text-muted-foreground">
              No skills found. Please complete an interview to see your skill
              stats.
            </p>
          </div>
        </>
      ) : (
        <Carousel>
          <CarouselContent className="gap-6 ml-2">
            {bundles.map((bundle, index) => {
              const status = getStatus(bundle.stats.avg_score);
              return (
                <CarouselItem key={index} className="pl-2 lg:basis-1/1">
                  <div className="space-y-5">
                    {/* Radial Progress Card */}
                    <Card className="w-full shadow-sm">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-base capitalize">
                              {bundle.stats.skill}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Current Grade Avg:{' '}
                              {Math.round(bundle.stats.avg_score)}%
                            </p>
                          </div>
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getBadgeColor(bundle.stats.avg_score)}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressBarColor(bundle.stats.avg_score)} transition-all duration-500`}
                            style={{ width: `${bundle.stats.avg_score}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Recommendations */}
                    <section className="space-y-3 py-3">
                      <h2 className="font-semibold text-lg">
                        Recommended for you
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {bundle.courses.map((course) => (
                          <Card
                            key={course.id}
                            className="hover:shadow-lg transition-shadow"
                          >
                            <CardHeader className="flex justify-between items-start gap-2">
                              <span className="font-medium text-base leading-snug">
                                {course.title}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs whitespace-nowrap"
                              >
                                {course.provider}
                              </Badge>
                            </CardHeader>

                            {/* {course.thumbnail && (
                            <img
                              src={course.thumbnail}
                              alt="Course preview"
                              className="rounded-md w-full h-[150px] object-cover px-4"
                            />
                          )} */}

                            <CardContent className="flex items-center justify-between px-4 pb-4">
                              <span className="text-xs text-muted-foreground">
                                {(course.length_minutes / 60).toFixed(1)} h
                              </span>

                              <Link
                                href={course.url}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                Link <ExternalLink className="w-4 h-4" />
                              </Link>
                            </CardContent>

                            {course.tags?.length > 0 && (
                              <div className="flex gap-2 px-4 pb-4 flex-wrap">
                                {course.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Want to improve your{' '}
                        <strong>{bundle.stats.skill}</strong>? These courses can
                        help you grow.
                      </p>
                    </section>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
    </div>
  );
}
