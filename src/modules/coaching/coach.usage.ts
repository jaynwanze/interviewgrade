import 'server-only';

import { sql } from 'drizzle-orm';

import { db } from '@/db/client';

type CoachReservationRow = {
  allowed: boolean;
  session_used: number;
  session_limit: number;
  burst_used: number;
  burst_limit: number;
  retry_after_seconds: number;
};

export type CoachReservation = {
  allowed: boolean;
  sessionUsed: number;
  sessionLimit: number;
  burstUsed: number;
  burstLimit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export async function reserveCoachRequest(
  userId: string,
  sessionId: string,
): Promise<CoachReservation> {
  const result = await db.execute<CoachReservationRow>(sql`
    select *
    from public.reserve_v2_coach_request(
      ${userId}::uuid,
      ${sessionId}::uuid
    )
  `);
  const row = result[0];

  if (!row) {
    throw new Error('Coach usage reservation returned no result.');
  }

  const sessionUsed = Number(row.session_used);
  const sessionLimit = Number(row.session_limit);
  const burstUsed = Number(row.burst_used);
  const burstLimit = Number(row.burst_limit);
  const retryAfterSeconds = Number(row.retry_after_seconds);

  if (
    !Number.isFinite(sessionUsed) ||
    !Number.isFinite(sessionLimit) ||
    !Number.isFinite(burstUsed) ||
    !Number.isFinite(burstLimit) ||
    !Number.isFinite(retryAfterSeconds)
  ) {
    throw new Error('Invalid Coach usage reservation returned by the database.');
  }

  return {
    allowed: row.allowed,
    sessionUsed,
    sessionLimit,
    burstUsed,
    burstLimit,
    remaining: Math.max(0, sessionLimit - sessionUsed),
    retryAfterSeconds: Math.max(0, retryAfterSeconds),
  };
}
