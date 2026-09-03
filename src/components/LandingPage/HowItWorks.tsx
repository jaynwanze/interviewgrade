'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Mic,
  Sparkles,
} from 'lucide-react';

const steps = [
  {
    icon: Sparkles,
    step: '01',
    eyebrow: 'Create',
    title: 'Build the Practice around the role.',
    description:
      'Generate with AI, upload source material, or start manually. Get to a focused interview without wading through setup.',
    visual: 'create' as const,
  },
  {
    icon: MessageSquare,
    step: '02',
    eyebrow: 'Practice',
    title: 'Interview with Avery, not a form.',
    description:
      'Answer naturally with voice-first controls while the interface stays focused on the question in front of you.',
    visual: 'answer' as const,
  },
  {
    icon: BarChart3,
    step: '03',
    eyebrow: 'Improve',
    title: 'Turn every attempt into a clearer next step.',
    description:
      'See rubric evidence, strengths, score movement and the one thing worth practising next instead of another wall of feedback.',
    visual: 'report' as const,
  },
];

export default function HowItWorks() {
  return (
    <section
      className="border-y border-border/60 bg-muted/[0.08] px-4 py-16 sm:px-6 sm:py-24"
      id="how-it-works"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <div className="text-sm font-medium text-primary">How it works</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.08]">
            Create. Interview. Improve.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            InterviewGrade keeps the loop simple: prepare the right Practice, answer
            naturally with Avery, then use structured evidence to make the next attempt
            better.
          </p>
        </div>

        <div className="mt-12 space-y-6 sm:mt-16 sm:space-y-10">
          {steps.map((step, index) => (
            <motion.article
              key={step.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="grid overflow-hidden rounded-2xl border border-border/80 bg-background/55 lg:grid-cols-[0.82fr_1.18fr]"
            >
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                      {step.step}
                    </span>
                  </div>
                  <div className="mt-8 text-sm font-medium text-primary">{step.eyebrow}</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/70 bg-muted/[0.08] p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
                <ProductStepVisual type={step.visual} />
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
      <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-muted/10 p-5 sm:min-h-80">
        <div className="absolute inset-x-10 top-10 h-24 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative w-full max-w-xl rounded-xl border bg-background/85 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">New Practice</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Senior backend engineer interview
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                5 questions
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                Medium
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
              Generate with AI
            </div>
            <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
              Upload material
            </div>
            <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
              Build manually
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'answer') {
    return (
      <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-muted/10 p-5 sm:min-h-80">
        <div className="relative w-full max-w-xl rounded-xl border bg-background/85 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Question 2 of 5
              </div>
              <div className="mt-1 text-sm font-medium">Avery · Interviewer</div>
            </div>
            <span className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground">
              Listening
            </span>
          </div>
          <p className="mt-6 text-lg font-semibold leading-7">
            Tell me about a difficult technical decision you made.
          </p>
          <div className="mt-7 flex items-center justify-between rounded-lg border bg-muted/10 p-4">
            <div className="flex h-7 items-center gap-1">
              {[5, 10, 7, 14, 8, 12, 6, 11, 5].map((height, index) => (
                <motion.span
                  key={`${height}-${index}`}
                  animate={{ height: [4, height, 5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.06 }}
                  className="w-0.5 rounded-full bg-primary/80"
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
              <Mic className="h-3.5 w-3.5" /> Record
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-muted/10 p-5 sm:min-h-80">
      <div className="relative w-full max-w-xl rounded-xl border bg-background/85 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Final report</div>
            <div className="mt-1 text-base font-semibold">Strong performance</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">82</div>
            <div className="text-[10px] text-muted-foreground">/100</div>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {[
            ['Problem solving', 86],
            ['Communication', 79],
            ['Technical depth', 81],
          ].map(([label, score], index) => (
            <div key={String(label)}>
              <div className="flex justify-between text-xs">
                <span>{label}</span>
                <span className="text-muted-foreground">{score}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.08 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Clear next focus included
        </div>
      </div>
    </div>
  );
}
