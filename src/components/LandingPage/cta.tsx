import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function CTA() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border/80 bg-card/60 px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> Ready to practise?
        </div>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Make your next interview attempt more useful than the last.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Start with a free Practice, answer naturally, and use structured feedback
          to focus your next attempt.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/c/sign-up">
              Start practising free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/c/login">Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
