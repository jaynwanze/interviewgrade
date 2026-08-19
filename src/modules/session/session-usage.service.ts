import 'server-only';

import { and, count, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { sessions } from '@/db/schema/sessions';
import { canStartSession } from '@/data/user/candidate';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

async function countV2PracticeSessionsSince(
  participantUserId: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.participantUserId, participantUserId),
        gte(sessions.createdAt, since),
      ),
    );

  return Number(row?.value ?? 0);
}

/**
 * Transitional quota view while Practice history spans legacy interviews and
 * v2 sessions. Mock Interview remains legacy-only, so only Practice needs the
 * combined count.
 */
export async function canStartV2AwarePracticeSession(): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  isPro: boolean;
}> {
  const legacyAccess = await canStartSession('practice');
  if (legacyAccess.isPro) {
    return legacyAccess;
  }

  const user = await serverGetLoggedInUser();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const v2Usage = await countV2PracticeSessionsSince(user.id, startOfMonth);
  const remaining = Math.max(0, legacyAccess.remaining - v2Usage);

  return {
    allowed: remaining > 0,
    remaining,
    limit: legacyAccess.limit,
    isPro: false,
  };
}
