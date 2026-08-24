import Link from 'next/link';
import { CheckCircle2, Euro } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { pricing } from '@/data/anon/pricing';
import { cn } from '@/lib/utils';

const Pricing = () => {
  return (
    <section className="border-y border-border/60 bg-muted/[0.08] px-4 py-16 sm:px-6 sm:py-20" id="pricing">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-sm font-medium text-muted-foreground">
            <Euro className="h-4 w-4 text-primary" /> Pricing
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Start free. Upgrade when you need more practice.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Simple monthly allowances for AI-created Practices and AI Practice runs.
            Manual Practice creation stays unlimited.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {pricing.map((item) => (
            <PricingCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({
  title,
  price,
  features,
  description,
  isHighlighted = false,
}: {
  title: string;
  price: string;
  features: string[];
  description: string;
  isHighlighted?: boolean;
}) => {
  return (
    <Card
      className={cn(
        'relative flex h-full flex-col border-border/80 bg-card/60',
        isHighlighted && 'border-primary/40 bg-primary/[0.04]',
      )}
    >
      <CardHeader className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="mt-1 leading-6">{description}</CardDescription>
          </div>
          {isHighlighted && <Badge>Most popular</Badge>}
        </div>

        <div className="flex items-end gap-1">
          <span className="text-4xl font-semibold tracking-tight">€{price}</span>
          <span className="pb-1 text-sm text-muted-foreground">/ month</span>
        </div>

        <Button asChild variant={isHighlighted ? 'default' : 'outline'} className="w-full">
          <Link href="/c/sign-up">Start free</Link>
        </Button>
      </CardHeader>

      <CardContent className="mt-auto p-5 pt-0 sm:p-6 sm:pt-0">
        <div className="border-t border-border/70 pt-5">
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="leading-6 text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default Pricing;
