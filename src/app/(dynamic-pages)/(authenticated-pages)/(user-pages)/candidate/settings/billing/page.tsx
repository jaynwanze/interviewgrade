'use client';

import { T } from '@/components/ui/Typography';
import { NormalizedSubscription } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { Suspense } from 'react';
import { CandidateSubscriptionDetails } from './CandidateSubscripionDetails';

const activeSubscription: NormalizedSubscription = {
  type: 'no-subscription',
};

async function Subscription() {
  const normalizedSubscription = activeSubscription;
  //await getCurrentCandidateSubscription(candidateId);

  return (
    <CandidateSubscriptionDetails
      normalizedSubscription={normalizedSubscription}
    />
  );
}

export default async function CandidateSettingsPage() {
  return (
    <Suspense fallback={<T.Subtle>Loading billing details...</T.Subtle>}>
      <Subscription />
    </Suspense>
  );
}
