import 'server-only';

import { canStartSession } from '@/data/user/candidate';

export type PracticeSessionAccess = {
  allowed: boolean;
  remaining: number;
  limit: number;
  isPro: boolean;
};

/**
 * Temporary compatibility boundary around the original candidate billing and
 * usage model. V2 session code should depend on this gateway rather than
 * importing the legacy candidate data module directly.
 *
 * Keep behavior identical until the post-V2 product/billing decision replaces
 * candidate subscription rules with the final creator/participant usage model.
 */
export async function getLegacyPracticeSessionAccess(): Promise<PracticeSessionAccess> {
  return canStartSession('practice');
}
