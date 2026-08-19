import 'server-only';

import { and, count, eq, gte } from 'drizzle-orm';

import { sessions } from '@/db/schema/sessions';
import { canStartSession } from '@/data/user/candidate';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

async function countV2PracticeSessionsSince(
  participantUserId: string,
  since: Date,
): Promise<number> {
  // Keep the legacy Practice library deployable before DATABASE_URL is
  // configured in every environment. Importing the database client lazily
  // prevents a missing v2 connection from crashing the quota Server Action at
  // module load time.
  const { db } = await import('@/db/client');

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

  let v2Usage: number;
  try {
    v2Usage = await countV2PracticeSessionsSince(user.id, startOfMonth);
  } catch (error) {
    // During the strangler migration the legacy library and quota are still a
    // valid fallback. Do not make the usage panel or Create Practice entry
    // disappear merely because v2 persistence has not been configured yet.
    console.warn(
      'canStartV2AwarePracticeSession: v2 usage unavailable; using legacy quota',
      error,
    );
    return legacyAccess;
  }

  const remaining = Math.max(0, legacyAccess.remaining - v2Usage);

  return {
    allowed: remaining > 0,
    remaining,
    limit: legacyAccess.limit,
    isPro: false,
  };
}
