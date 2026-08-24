'use client';

import { motion } from 'framer-motion';
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

const waveform = [4, 8, 12, 7, 15, 9, 5, 11, 16, 8, 13, 6, 10, 14, 7];

export default function HeroSection() {
  return (
    <section className="px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-sm font-medium text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI-powered interview practice
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.5 }}
            className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Practice interviews. Get structured feedback. Improve faster.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg"
          >
            Create or choose a Practice, answer naturally with Avery, and get
            rubric-based feedback plus a detailed report after every session.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="min-w-44">
              <Link href="/c/sign-up">
                Start practising free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-44">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.24, duration: 0.65, ease: 'easeOut' }}
          className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/10"
        >
          <div className="pointer-events-none absolute inset-x-24 top-0 h-24 bg-primary/5 blur-3xl" />
          <div className="relative flex items-center justify-between border-b border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Frontend Engineer Practice
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:block">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: '20%' }}
                  animate={{ width: ['20%', '40%', '40%'] }}
                  transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.25 }}
                />
              </div>
              <span className="rounded-full border px-2 py-1">Question 2 of 5</span>
            </div>
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="p-4 sm:p-6">
              <motion.div
                animate={{ borderColor: ['hsl(var(--border))', 'hsl(var(--primary) / 0.35)', 'hsl(var(--border))'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                className="rounded-xl border bg-background/40 p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Avery · Interviewer</div>
                    <div className="mt-1 text-xs text-muted-foreground">Current question</div>
                  </div>
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    Listening
                  </motion.span>
                </div>

                <h2 className="mt-6 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
                  Walk me through a complex UI you built. What were the biggest
                  challenges and how did you solve them?
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Suggested answer time: 2–3 minutes
                </p>
              </motion.div>

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
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    className="flex aspect-video items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    >
                      <Mic className="h-7 w-7" />
                    </motion.div>
                  </motion.div>
                  <div className="space-y-4">
                    <div className="flex h-8 items-center justify-center gap-1">
                      {waveform.map((height, index) => (
                        <motion.span
                          key={`${height}-${index}`}
                          className="w-1 rounded-full bg-primary/80"
                          animate={{
                            height: [Math.max(4, height * 0.55), height, Math.max(4, height * 0.7)],
                            opacity: [0.45, 0.95, 0.55],
                          }}
                          transition={{
                            duration: 0.85,
                            repeat: Infinity,
                            delay: index * 0.045,
                            repeatType: 'mirror',
                          }}
                        />
                      ))}
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
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1 }}
                  className="rounded-xl border bg-background/60 p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-primary" /> Rubric focus
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Problem solving', 'System design', 'Communication'].map((item, index) => (
                      <motion.span
                        key={item}
                        animate={{
                          borderColor: [
                            'hsl(var(--border))',
                            index === 0 ? 'hsl(var(--primary) / 0.45)' : 'hsl(var(--border))',
                            'hsl(var(--border))',
                          ],
                          backgroundColor: [
                            'hsl(var(--muted) / 0.4)',
                            index === 0 ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--muted) / 0.4)',
                            'hsl(var(--muted) / 0.4)',
                          ],
                        }}
                        transition={{ duration: 4, repeat: Infinity, delay: index * 0.35 }}
                        className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  animate={{ opacity: [0.76, 1, 0.76] }}
                  transition={{ duration: 3.6, repeat: Infinity, delay: 0.5 }}
                  className="rounded-xl border bg-background/60 p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquareText className="h-4 w-4 text-primary" /> Feedback
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Structured coaching appears after you submit your answer.
                  </p>
                </motion.div>

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
        </motion.div>
      </div>
    </section>
  );
}
