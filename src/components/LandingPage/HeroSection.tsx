'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-400/5 to-orange-400/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-2 text-sm border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30"
            >
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
              AI-Powered Interview Preparation
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Ace Your Next Interview with{' '}
            <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              AI Coaching
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Practice with realistic mock interviews, get instant AI feedback,
            and build the confidence to land your dream job.
            <span className="font-medium text-foreground">
              {' '}
              Join 10,000+ candidates
            </span>{' '}
            who improved their interview skills.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/c/signup">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
              >
                Start Free Practice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>3 free sessions included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image/Video Preview */}
        <motion.div
          className="mt-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-gradient-to-b from-muted/50 to-muted">
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                  <Play className="h-8 w-8 ml-1" />
                </div>
                <p className="text-sm">See InterviewGrade in action</p>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-medium">AI is listening...</span>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3">
              <div className="text-xs">
                <span className="font-bold text-green-500">85%</span>
                <span className="text-muted-foreground ml-1">Score</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
