'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-pink-500/10" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              Join 10,000+ successful candidates
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Ace Your Next Interview?
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop wondering "what if" and start preparing with confidence. Your
            dream job is just a few practice sessions away.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/c/signup">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
              >
                Start Free Practice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • 3 free sessions included • Setup in 2
            minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
