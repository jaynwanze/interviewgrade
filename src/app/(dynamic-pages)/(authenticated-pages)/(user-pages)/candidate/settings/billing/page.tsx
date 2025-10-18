'use server';

import { T } from '@/components/ui/Typography';
import { NormalizedSubscription } from '@/types';
import { Suspense } from 'react';
import { CandidateSubscriptionDetails } from './CandidateSubscripionDetails';
import { getCurrentCandidateSubscription } from '@/data/user/candidate';

const activeSubscription: NormalizedSubscription = {
  type: 'no-subscription',
};

async function Subscription() {
  const normalizedSubscription = await getCurrentCandidateSubscription();

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
