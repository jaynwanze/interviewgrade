'use client';

import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import { createCandidateSessionAction } from '@/data/user/candidate';
// import {
//   createCheckoutSessionAction
// } from '@/data/user/organizations';
import { createCustomerEmployeePortalLinkAction } from '@/data/user/employee';
import { useToastMutation } from '@/hooks/useToastMutation';
import { getStripe } from '@/utils/stripe-client';
import { ExternalLink } from 'lucide-react';

export function CreateSubscriptionButton({ priceId }: { priceId: string }) {
  const { mutate, isLoading } = useToastMutation(
    async () => {
      return await createCandidateSessionAction({
        priceId: priceId,
      });
    },
    {
      loadingMessage: 'Please wait...',
      errorMessage: 'Failed to create subscription',
      successMessage: 'Redirecting...',
      onSuccess: async (sessionId) => {
        const stripe = await getStripe();
        stripe?.redirectToCheckout({ sessionId: sessionId });
      },
    },
  );

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        mutate();
      }}
    >
      {isLoading ? 'Loading...' : 'Choose'}
    </Button>
  );
}

export function StartFreeTrialButton({
  organizationId,
  priceId,
}: {
  organizationId: string;
  priceId: string;
}) {
  const { mutate, isLoading } = useToastMutation(
    async () => {
      // return await createCheckoutSessionAction({
      //   organizationId: organizationId,
      //   priceId: priceId,
      //   isTrial: true,
      // });
    },
    {
      loadingMessage: 'Please wait...',
      errorMessage: 'Failed to create subscription',
      successMessage: 'Redirecting...',
      onSuccess: async (sessionId) => {
        const stripe = await getStripe();
        stripe?.redirectToCheckout({ sessionId: 'TO:DO' });
      },
    },
  );

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        mutate();
      }}
    >
      {isLoading ? 'Starting trial...' : 'Start Free Trial'}
    </Button>
  );
}

export function ManageSubscriptionButton() {
  const { mutate, isLoading } = useToastMutation(
    async () => {
      return await createCustomerEmployeePortalLinkAction('TO:DO');
    },
    {
      loadingMessage: 'Please wait...',
      errorMessage: 'Failed to get customer portal link',
      successMessage: 'Redirecting...',
      onSuccess: (portalLink) => {
        window.location.assign(portalLink);
      },
    },
  );

  return (
    <div className="space-y-2">
      <Button
        variant="default"
        type="button"
        onClick={() => {
          mutate();
        }}
      >
        <span>{isLoading ? 'Loading...' : 'Manage Subscription'} </span>
        <ExternalLink aria-hidden="true" className="ml-2 w-5 h-5" />{' '}
      </Button>
      <T.P className="text-muted-foreground text-sm">
        Manage your subscription. You can modify, upgrade or cancel your
        membership from here.
      </T.P>
    </div>
  );
}
