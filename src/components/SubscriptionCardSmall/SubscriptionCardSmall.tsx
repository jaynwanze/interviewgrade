import { T } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { getCurrentCandidateSubscription } from '@/data/user/candidate';
import { formatNormalizedSubscription } from '@/utils/formatNormalizedSubscription';
import { ArrowUpRight, Crown, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export async function SubscriptionCardSmall() {
  const normalizedSubscription = await getCurrentCandidateSubscription();

  const { title, sidenote, description } = formatNormalizedSubscription(
    normalizedSubscription,
  );

  const isPro =
    normalizedSubscription.type === 'active' ||
    normalizedSubscription.type === 'trialing';

  if (isPro) {
    // Pro user - show premium styled card
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link href="/candidate/settings/billing">
            <div className="group cursor-pointer relative overflow-hidden flex flex-col gap-1 items-start p-3 border border-yellow-300 dark:border-yellow-700 w-full rounded-lg bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-950/30 dark:via-orange-950/20 dark:to-amber-950/30 hover:shadow-md transition-all duration-200">
              {/* Sparkle decoration */}
              <Sparkles className="absolute top-2 right-2 h-4 w-4 text-yellow-500/50" />

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
                  <Crown className="h-3 w-3 text-white" />
                </div>
                <T.P className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {title}
                </T.P>
              </div>

              {sidenote && (
                <T.Small className="font-normal text-yellow-700 dark:text-yellow-300 group-hover:underline underline-offset-4 pl-7">
                  {sidenote}
                </T.Small>
              )}
            </div>
          </Link>
        </HoverCardTrigger>
        <HoverCardContent className="w-64">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Pro Member</span>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Click to manage your subscription
              </p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Free user - show upgrade prompt
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link href="/candidate/settings/billing" className="w-full block">
          <div className="group cursor-pointer relative overflow-hidden p-3 border border-dashed border-muted-foreground/30 w-full rounded-lg hover:border-yellow-400 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20 transition-all duration-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-muted rounded-full group-hover:bg-gradient-to-br group-hover:from-yellow-400 group-hover:to-orange-500 transition-all duration-200">
                  <Zap className="h-3 w-3 text-muted-foreground group-hover:text-white transition-colors duration-200" />
                </div>
                <div className="flex flex-col">
                  <T.Small className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Free Plan
                  </T.Small>
                  <T.Small className="text-xs text-muted-foreground">
                    Limited features
                  </T.Small>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 group-hover:scale-105 transition-transform"
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Upgrade
              </Badge>
            </div>
          </div>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">Upgrade to Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-yellow-500" />
              Unlimited interviews
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-yellow-500" />
              AI Coach assistance
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-yellow-500" />
              Detailed feedback & more
            </li>
          </ul>
          <Button size="sm" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
            <Crown className="h-3 w-3 mr-1.5" />
            Upgrade Now
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}