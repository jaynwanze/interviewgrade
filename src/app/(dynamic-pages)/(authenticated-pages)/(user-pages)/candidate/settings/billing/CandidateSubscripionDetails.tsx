import { Check, Crown, Gauge, Sparkles } from 'lucide-react';

import { T } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getActiveProductsByType } from '@/data/user/employee';
import type { V2PracticeRunUsage } from '@/modules/billing/v2-practice-run-usage';
import type { NormalizedSubscription, Product } from '@/types';

import {
  CreateSubscriptionButton,
  ManageSubscriptionButton,
} from './ActionButtons';

const SHARED_V2_FEATURES = [
  'Create, publish, and share reusable Practices',
  'Full per-answer feedback and final reports',
  'Creator Results for shared Practices',
];

function formatPrice(product: Product): string {
  const currency = (product.currency || 'eur').toUpperCase();
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format((product.price_unit_amount ?? 0) / 100);
}

function formatResetDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'next month';

  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

async function UpgradeToProCard() {
  const activeProducts = await getActiveProductsByType('subscription');
  const paidProducts = activeProducts.filter(
    (product) =>
      (product.price_unit_amount ?? 0) > 0 &&
      Boolean(product.price_id),
  );

  if (paidProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pro</CardTitle>
          <CardDescription>
            Pro checkout is temporarily unavailable. Your Free plan remains active.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
        <p className="text-sm text-muted-foreground">
          Same InterviewGrade experience, with a much larger monthly Practice-run
          allowance.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {paidProducts.map((product) => {
          if (!product.price_id) return null;

          return (
            <Card key={product.id ?? product.price_id} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      {product.title || 'Pro'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      50 AI-evaluated Practice runs each month.
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold">
                      {formatPrice(product)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {product.pricing_plan_interval || 'month'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <PlanFeatures runLimit={50} />
                <CreateSubscriptionButton
                  priceId={product.price_id}
                  label="Upgrade to Pro"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PlanFeatures({ runLimit }: { runLimit: number }) {
  const features = [
    `${runLimit} AI-evaluated Practice runs per month`,
    ...SHARED_V2_FEATURES,
  ];

  return (
    <ul className="space-y-2">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function InactiveSubscriptionNotice({
  normalizedSubscription,
}: {
  normalizedSubscription?: NormalizedSubscription;
}) {
  if (
    !normalizedSubscription ||
    normalizedSubscription.type === 'no-subscription' ||
    normalizedSubscription.type === 'active' ||
    normalizedSubscription.type === 'trialing'
  ) {
    return null;
  }

  const status = normalizedSubscription.type.replaceAll('_', ' ');

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
      Your previous subscription is <span className="font-medium">{status}</span>.
      The Free Practice-run allowance applies until the subscription becomes active
      again.
    </div>
  );
}

export async function CandidateSubscriptionDetails({
  normalizedSubscription,
  practiceRunUsage,
}: {
  normalizedSubscription?: NormalizedSubscription;
  practiceRunUsage: V2PracticeRunUsage;
}) {
  const isPro = practiceRunUsage.plan === 'pro';
  const usagePercent = Math.min(
    100,
    Math.max(0, (practiceRunUsage.used / practiceRunUsage.limit) * 100),
  );
  const planLabel =
    isPro && normalizedSubscription?.type === 'trialing'
      ? 'Pro trial'
      : isPro
        ? 'Pro'
        : 'Free';

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <T.H3>Plan & usage</T.H3>
        <T.Subtle>
          Practice runs cover both your own sessions and participants using
          Practices you created.
        </T.Subtle>
      </div>

      <InactiveSubscriptionNotice
        normalizedSubscription={normalizedSubscription}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPro ? (
                  <Crown className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {planLabel} plan
              </CardTitle>
              <CardDescription className="mt-1">
                {practiceRunUsage.limit} AI-evaluated Practice runs per calendar
                month.
              </CardDescription>
            </div>
            <Badge variant={isPro ? 'default' : 'secondary'}>{planLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-4 rounded-lg border bg-muted/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gauge className="h-4 w-4" />
                  Practice runs this month
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  {practiceRunUsage.used}
                  <span className="text-base font-normal text-muted-foreground">
                    {' '}
                    / {practiceRunUsage.limit}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">{practiceRunUsage.remaining} left</div>
                <div className="text-muted-foreground">
                  Resets {formatResetDate(practiceRunUsage.resetsAt)}
                </div>
              </div>
            </div>

            <Progress value={usagePercent} />

            <p className="text-xs leading-5 text-muted-foreground">
              A run is consumed when the first valid answer is submitted. Opening a
              shared link, starting an empty session, or viewing results does not use
              a run.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Included in {planLabel}</div>
            <PlanFeatures runLimit={practiceRunUsage.limit} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How shared Practice usage works</CardTitle>
          <CardDescription>
            Participants do not need a paid plan to use a Practice you share.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            When a participant submits the first answer to a Practice you created,
            one run is taken from your monthly allowance.
          </p>
          <p>
            The rest of that session, including feedback and the final report, is
            included in the same run.
          </p>
        </CardContent>
      </Card>

      {isPro ? (
        <Card>
          <CardHeader>
            <CardTitle>Manage Pro</CardTitle>
            <CardDescription>
              Your existing Stripe subscription continues to manage billing for
              InterviewGrade Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManageSubscriptionButton />
          </CardContent>
        </Card>
      ) : (
        <UpgradeToProCard />
      )}
    </div>
  );
}
