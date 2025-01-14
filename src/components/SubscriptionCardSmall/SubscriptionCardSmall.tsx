import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { getNormalizedOrganizationSubscription } from '@/data/user/organizations';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { NormalizedSubscription } from '@/types';
import { formatNormalizedSubscription } from '@/utils/formatNormalizedSubscription';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const activeSubscription: NormalizedSubscription = {
  type: 'active',
  product: {
    id: 'prod_002',
    product_type: 'subscription',
    title: 'Standard Tier',
    description: 'Access to standard features and more tokens.',
    price: 9.99,
    status: 'active',
    amount: 20,
  },
  price: {
    id: 'price_002',
    product_id: 'prod_002',
    active: true,
    description: 'Standard Tier Subscription',
    unit_amount: 999,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    interval_count: 1,
    trial_period_days: 14,
    metadata: {
      tier: 'standard',
    },
  },
  subscription: {
    id: 'sub_001',
    status: 'active',
    metadata: '{"user_id":"11111111-1111-1111-1111-111111111111","tier":"standard"}',
    price_id: 'price_002',
    quantity: 1,
    cancel_at_period_end: false,
    created: '2024-03-01T09:00:00Z',
    current_period_start: '2024-03-01T09:00:00Z',
    current_period_end: '2024-04-01T09:00:00Z',
    ended_at: null,
    cancel_at: null,
    canceled_at: null,
    trial_start: null,
    trial_end: null,
  },
};


export async function SubscriptionCardSmall({
  organizationId,
}: {
  organizationId: string;
}) {
  const supabaseClient = createSupabaseUserServerComponentClient();
  const normalizedSubscription = activeSubscription;
    
  const { title, sidenote, description } = formatNormalizedSubscription(
    normalizedSubscription,
  );

  if (title) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link href={`/candidate/settings/billing`}>
            <div className="group cursor-pointer flex flex-col gap-1 items-start p-2 py-2 pb-3 border w-full rounded-lg">
              <T.P className="font-semibold ">{title} Pro</T.P>
              {sidenote ? (
                <T.Small className=" font-normal  group-hover:underline underline-offset-4">
                  {sidenote}
                </T.Small>
              ) : null}
            </div>
          </Link>
        </HoverCardTrigger>
        <HoverCardContent className="w-60">{description}</HoverCardContent>
      </HoverCard>
    );
  } else {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link
            className="w-full cursor-pointer flex mr-2 gap-2 items-center mt-1 rounded-lg"
            href={`/candidate/settings/billing`}
          >
            <Button variant="default" className="w-full">
              <ArrowUpRight className="h-5 w-5 mr-2 " />
              {sidenote}
            </Button>
          </Link>
        </HoverCardTrigger>
        <HoverCardContent className="w-60">{description}</HoverCardContent>
      </HoverCard>
    );
  }
}
