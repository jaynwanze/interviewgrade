'use server';

import { Suspense } from 'react';

import { T } from '@/components/ui/Typography';
import { getCurrentCandidateSubscription } from '@/data/user/candidate';
import { getCurrentV2PracticeRunUsage } from '@/modules/billing/v2-practice-run-usage';

import { CandidateSubscriptionDetails } from './CandidateSubscripionDetails';

async function Subscription() {
  const [normalizedSubscription, practiceRunUsage] = await Promise.all([
    getCurrentCandidateSubscription(),
    getCurrentV2PracticeRunUsage(),
  ]);

  return (
    <CandidateSubscriptionDetails
      normalizedSubscription={normalizedSubscription}
      practiceRunUsage={practiceRunUsage}
    />
  );
}

export default async function CandidateSettingsPage() {
  return (
    <Suspense fallback={<T.Subtle>Loading plan and usage...</T.Subtle>}>
      <Subscription />
    </Suspense>
  );
}
