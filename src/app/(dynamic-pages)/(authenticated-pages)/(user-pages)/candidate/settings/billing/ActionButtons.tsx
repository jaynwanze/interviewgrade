'use client';

import { ExternalLink } from 'lucide-react';

import { T } from '@/components/ui/Typography';
import { Button } from '@/components/ui/button';
import {
  createCandidatePortalSessionAction,
  createCandidateSessionAction,
} from '@/data/user/candidate';
import { useToastMutation } from '@/hooks/useToastMutation';
import { getStripe } from '@/utils/stripe-client';

export function CreateSubscriptionButton({
  priceId,
  label = 'Choose',
}: {
  priceId: string;
  label?: string;
}) {
  const { mutate, isLoading } = useToastMutation(
    async () => {
      return await createCandidateSessionAction({
        priceId,
      });
    },
    {
      loadingMessage: 'Please wait...',
      errorMessage: 'Failed to create subscription',
      successMessage: 'Redirecting...',
      onSuccess: async (sessionId) => {
        const stripe = await getStripe();
        stripe?.redirectToCheckout({ sessionId });
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
      {isLoading ? 'Loading...' : label}
    </Button>
  );
}

export function ManageSubscriptionButton() {
  const { mutate, isLoading } = useToastMutation(
    async () => {
      return await createCandidatePortalSessionAction();
    },
    {
      loadingMessage: 'Opening subscription portal...',
      errorMessage: 'Failed to open subscription management',
      successMessage: 'Redirecting...',
      onSuccess: async (portalUrl) => {
        window.location.href = portalUrl;
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
        <span>{isLoading ? 'Loading...' : 'Manage Subscription'}</span>
        <ExternalLink aria-hidden="true" className="ml-2 h-5 w-5" />
      </Button>
      <T.P className="text-sm text-muted-foreground">
        Update payment details, review billing, or cancel your membership in the
        Stripe customer portal.
      </T.P>
    </div>
  );
}
