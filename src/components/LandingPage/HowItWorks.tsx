'use client';

import { BarChart3, MessageSquare, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Sparkles,
    step: '01',
    title: 'Create or choose a Practice',
    description:
      'Generate a focused Practice with AI, upload source material, or start from an existing Practice.',
  },
  {
    icon: MessageSquare,
    step: '02',
    title: 'Answer naturally with Avery',
    description:
      'Work through realistic spoken questions with a clear prompt, recording controls, and question-specific rubric focus.',
  },
  {
    icon: BarChart3,
    step: '03',
    title: 'Review feedback and improve',
    description:
      'Get structured rubric feedback after answers and a final report showing strengths, gaps, and what to practise next.',
  },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-border/60 bg-muted/[0.08] px-4 py-16 sm:px-6 sm:py-20" id="how-it-works">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="text-sm font-medium text-primary">How it works</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            A simple loop from practice to progress.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            InterviewGrade keeps the flow focused: prepare, answer, then use clear
            evidence-based coaching to improve the next attempt.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.step}
              className="rounded-xl border border-border/80 bg-background/50 p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
