import { Sparkles } from 'lucide-react';

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
            Everything you need to practise with purpose.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            A focused Practice workflow from creation to spoken answers, structured
            feedback, and review.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {featuresData.map((feature) => (
            <article
              key={feature.name}
              className="group rounded-2xl border border-border/80 bg-card/50 p-5 transition-colors hover:bg-card sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{feature.name}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
              <div className="mt-5 border-t border-border/60 pt-4 text-xs font-medium text-muted-foreground">
                {feature.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
