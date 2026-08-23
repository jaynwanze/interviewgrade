import { getCurrentCandidateSubscription } from '@/data/user/candidate';
import { ChevronRight, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';

export async function SubscriptionCardSmall() {
  const normalizedSubscription = await getCurrentCandidateSubscription();
  const isPro =
    normalizedSubscription.type === 'active' ||
    normalizedSubscription.type === 'trialing';

  return (
    <Link
      href="/candidate/settings/billing"
      className="group block rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-foreground">
            {isPro ? (
              <Crown className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {isPro ? 'Pro plan' : 'Free plan'}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {isPro ? '30 runs · 30 AI generations' : '3 runs · 3 AI generations'}
            </div>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
