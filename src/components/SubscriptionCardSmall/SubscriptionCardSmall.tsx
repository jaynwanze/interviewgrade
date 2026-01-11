import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { getCurrentCandidateSubscription } from '@/data/user/candidate';
// import { getNormalizedOrganizationSubscription } from '@/data/user/organizations';
import { formatNormalizedSubscription } from '@/utils/formatNormalizedSubscription';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export async function SubscriptionCardSmall() {
  const normalizedSubscription = await getCurrentCandidateSubscription();

  const { title, sidenote, description } = formatNormalizedSubscription(
    normalizedSubscription,
  );

  if (title) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link href={`/candidate/settings/billing`}>
            <div className="group cursor-pointer flex flex-col gap-1 items-start p-2 py-2 pb-3 border w-full rounded-lg">
              <T.P className="font-semibold ">{title}</T.P>
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
