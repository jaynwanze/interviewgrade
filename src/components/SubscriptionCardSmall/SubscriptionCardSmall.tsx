import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
// import { getNormalizedOrganizationSubscription } from '@/data/user/organizations';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { NormalizedSubscription } from '@/types';
import { formatNormalizedSubscription } from '@/utils/formatNormalizedSubscription';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export async function SubscriptionCardSmall({
  organizationId,
}: {
  organizationId: string;
}) {
  const supabaseClient = createSupabaseUserServerComponentClient();
  const normalizedSubscription: NormalizedSubscription = {
    type: 'no-subscription',
  }; // Replace with actual data fetching logic

  const { title, sidenote, description } = formatNormalizedSubscription(
    normalizedSubscription,
  );

  if (title) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link href={`/employer/${organizationId}/settings/billing`}>
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
            href={`/employer/${organizationId}/settings/billing`}
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
