'use server';

import { Suspense } from 'react';

import { T } from '@/components/ui/Typography';
import { getCurrentCandidateSubscription } from '@/data/user/candidate';
import { getCurrentV2PracticeGenerationUsage } from '@/modules/billing/v2-practice-generation-usage';
import { getCurrentV2PracticeRunUsage } from '@/modules/billing/v2-practice-run-usage';

import { CandidateSubscriptionDetails } from './CandidateSubscripionDetails';

async function Subscription() {
  const [normalizedSubscription, practiceRunUsage, practiceGenerationUsage] =
    await Promise.all([
      getCurrentCandidateSubscription(),
      getCurrentV2PracticeRunUsage(),
      getCurrentV2PracticeGenerationUsage(),
    ]);

  return (
    <CandidateSubscriptionDetails
      normalizedSubscription={normalizedSubscription}
      practiceRunUsage={practiceRunUsage}
      practiceGenerationUsage={practiceGenerationUsage}
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
