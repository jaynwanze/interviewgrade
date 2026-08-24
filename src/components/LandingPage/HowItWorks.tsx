'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  FileText,
  MessageSquare,
  Mic,
  Sparkles,
} from 'lucide-react';

const steps = [
  {
    icon: Sparkles,
    step: '01',
    title: 'Create or choose a Practice',
    description: 'Generate with AI, upload source material, or build manually.',
    visual: 'create' as const,
  },
  {
    icon: MessageSquare,
    step: '02',
    title: 'Answer naturally with Avery',
    description: 'Work through focused spoken questions with clear recording controls.',
    visual: 'answer' as const,
  },
  {
    icon: BarChart3,
    step: '03',
    title: 'Review feedback and improve',
    description: 'See rubric evidence, strengths, and exactly what to practise next.',
    visual: 'report' as const,
  },
];

export default function HowItWorks() {
  return (
    <section
      className="border-y border-border/60 bg-muted/[0.08] px-4 py-16 sm:px-6 sm:py-20"
      id="how-it-works"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="text-sm font-medium text-primary">How it works</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            See the whole practice loop at a glance.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Less setup, less clutter. Create a Practice, answer with Avery, then use
            structured feedback to improve the next attempt.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-border/80 bg-background/55"
            >
              <ProductStepVisual type={step.visual} />
              <div className="border-t border-border/70 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductStepVisual({ type }: { type: (typeof steps)[number]['visual'] }) {
  if (type === 'create') {
    return (
      <div className="relative h-52 overflow-hidden bg-muted/15 p-5">
        <div className="absolute inset-x-10 top-3 h-20 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative rounded-xl border bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">New Practice</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-7 rounded-md border bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
              Senior backend engineer interview
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                5 questions
              </div>
              <div className="rounded-md border bg-muted/20 p-2 text-[10px] text-muted-foreground">
                Medium
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="rounded-md bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground">
              Generate with AI
            </div>
            <div className="rounded-md border px-3 py-1.5 text-[10px] text-muted-foreground">
              Upload file
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'answer') {
    return (
      <div className="relative h-52 overflow-hidden bg-muted/15 p-5">
        <div className="relative rounded-xl border bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Question 2 of 5
              </div>
              <div className="mt-1 text-xs font-medium">Avery · Interviewer</div>
            </div>
            <span className="rounded-full border px-2 py-1 text-[9px] text-muted-foreground">
              Listening
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold leading-5">
            Tell me about a difficult technical decision you made.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-lg border bg-muted/10 p-3">
            <div className="flex items-center gap-1">
              {[5, 10, 7, 14, 8, 12, 6, 11, 5].map((height, index) => (
                <motion.span
                  key={`${height}-${index}`}
                  animate={{ height: [4, height, 5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.06 }}
                  className="w-0.5 rounded-full bg-primary/80"
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-medium text-primary-foreground">
              <Mic className="h-3 w-3" /> Record
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-52 overflow-hidden bg-muted/15 p-5">
      <div className="relative rounded-xl border bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground">Final report</div>
            <div className="mt-0.5 text-sm font-semibold">Strong performance</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">82</div>
            <div className="text-[9px] text-muted-foreground">/100</div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            ['Problem solving', '86%'],
            ['Communication', '79%'],
            ['Technical depth', '81%'],
          ].map(([label, score], index) => (
            <div key={label}>
              <div className="flex justify-between text-[10px]">
                <span>{label}</span>
                <span className="text-muted-foreground">{score}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${[86, 79, 81][index]}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.08 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Clear next steps included
        </div>
      </div>
    </div>
  );
}
