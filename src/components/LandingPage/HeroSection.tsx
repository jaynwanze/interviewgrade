'use client';

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageSquareText,
  Mic,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-powered interview practice
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Practice interviews. Get structured feedback. Improve faster.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Create or choose a Practice, answer naturally with Avery, and get
            rubric-based feedback plus a detailed report after every session.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-44">
              <Link href="/c/sign-up">
                Start practising free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-44">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> 3 AI Practice runs free
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> No card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Structured rubric feedback
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Frontend Engineer Practice
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-1">Question 2 of 5</span>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="p-4 sm:p-6">
              <div className="rounded-xl border bg-background/40 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Avery · Interviewer</div>
                    <div className="mt-1 text-xs text-muted-foreground">Current question</div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Listening
                  </span>
                </div>

                <h2 className="mt-6 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
                  Walk me through a complex UI you built. What were the biggest
                  challenges and how did you solve them?
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Suggested answer time: 2–3 minutes
                </p>
              </div>

              <div className="mt-4 rounded-xl border bg-background/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Your response</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Answer naturally. Retry before moving on if you want.
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Not recording</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                  <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground">
                    <Mic className="h-7 w-7" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex h-8 items-center justify-center gap-1">
                      {[4, 8, 12, 7, 15, 9, 5, 11, 16, 8, 13, 6, 10, 14, 7].map(
                        (height, index) => (
                          <span
                            key={`${height}-${index}`}
                            className="w-1 rounded-full bg-primary/80"
                            style={{ height }}
                          />
                        ),
                      )}
                    </div>
                    <Button className="w-full sm:w-auto">
                      <Mic className="mr-2 h-4 w-4" />
                      Start recording
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-border/70 bg-muted/10 p-4 lg:border-l lg:border-t-0 sm:p-5">
              <div className="space-y-4">
                <div className="rounded-xl border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-primary" /> Rubric focus
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Problem solving', 'System design', 'Communication'].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquareText className="h-4 w-4 text-primary" /> Feedback
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Structured coaching appears after you submit your answer.
                  </p>
                </div>

                <div className="rounded-xl border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BarChart3 className="h-4 w-4 text-primary" /> Final report
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Review rubric performance, strengths and what to focus on next.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
