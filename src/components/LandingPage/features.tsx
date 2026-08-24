'use client';

import { motion } from 'framer-motion';
import { BarChart3, FileText, Mic, Sparkles } from 'lucide-react';

import { featuresData } from '@/data/anon/features-data';

export default function Features() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20" id="features">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Features
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            See the product, not a list of promises.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            The core InterviewGrade workflow stays visible from Practice creation to
            spoken answers, rubric feedback, and review.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {featuresData.map((feature, index) => (
            <motion.article
              key={feature.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.42, delay: (index % 2) * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-border/80 bg-card/50 transition-colors hover:bg-card"
            >
              <FeatureVisual index={index} />
              <div className="border-t border-border/70 p-5 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{feature.name}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-4 text-xs font-medium text-muted-foreground">
                  {feature.detail}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="h-56 overflow-hidden bg-muted/10 p-5 sm:p-6">
        <div className="mx-auto max-w-md rounded-xl border bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Practice builder</div>
              <div className="mt-1 text-sm font-semibold">Backend Engineer Practice</div>
            </div>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
            {['5 questions', '3 criteria', '~20 min'].map((item) => (
              <div key={item} className="rounded-md border bg-muted/15 px-2 py-2 text-center text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {['System design trade-offs', 'API reliability under load', 'Technical communication'].map((item, itemIndex) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                  {itemIndex + 1}
                </span>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="h-56 overflow-hidden bg-muted/10 p-5 sm:p-6">
        <div className="mx-auto max-w-md rounded-xl border bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Avery · Question 3 of 5</span>
            <span className="rounded-full border px-2 py-1 text-[9px] text-muted-foreground">Recording</span>
          </div>
          <p className="mt-4 text-sm font-semibold leading-5">
            How would you diagnose a production API slowdown?
          </p>
          <div className="mt-5 flex items-center justify-between rounded-lg border bg-muted/10 p-3">
            <div className="flex h-8 items-center gap-1">
              {[7, 12, 5, 15, 9, 13, 6, 11, 8, 14, 5, 10].map((height, barIndex) => (
                <motion.span
                  key={`${height}-${barIndex}`}
                  animate={{ height: [4, height, 6] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: barIndex * 0.05 }}
                  className="w-0.5 rounded-full bg-primary/80"
                />
              ))}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Mic className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="h-56 overflow-hidden bg-muted/10 p-5 sm:p-6">
        <div className="mx-auto max-w-md rounded-xl border bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" /> Rubric feedback
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Problem solving', 86],
              ['Technical depth', 78],
              ['Communication', 82],
            ].map(([label, score], scoreIndex) => (
              <div key={String(label)}>
                <div className="flex items-center justify-between text-xs">
                  <span>{label}</span>
                  <span className="font-medium text-primary">{score}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, delay: scoreIndex * 0.08 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-[10px] leading-4 text-muted-foreground">
            Strong structure. Add one concrete production metric to make the answer more specific.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-56 overflow-hidden bg-muted/10 p-5 sm:p-6">
      <div className="mx-auto max-w-md space-y-2 transition-transform duration-300 group-hover:-translate-y-1">
        {[
          ['Frontend Engineer Practice', '82/100', 'Today'],
          ['Leadership Practice', '76/100', '21 Aug'],
          ['System Design Practice', '88/100', '18 Aug'],
        ].map(([title, score, date]) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border bg-background/80 p-3 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{title}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{date}</div>
            </div>
            <div className="text-xs font-semibold text-primary">{score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
