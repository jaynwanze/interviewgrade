'use server';

import { canStartV2AwarePracticeSession } from '@/modules/session/session-usage.service';

export async function canStartV2AwarePracticeSessionAction() {
  return canStartV2AwarePracticeSession();
}
