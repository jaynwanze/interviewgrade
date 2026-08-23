import 'server-only';

import { sql } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';

type PublicSessionStartReservationRow = {
  allowed: boolean;
  used: number;
  start_limit: number;
  retry_after_seconds: number;
};

export type PublicSessionStartReservation = {
  allowed: boolean;
  used: number;
  limit: number;
  retryAfterSeconds: number;
};

export async function reservePublicSessionStart(
  practiceId: string,
  database: InterviewGradeDatabase = db,
): Promise<PublicSessionStartReservation> {
  const result = await database.execute<PublicSessionStartReservationRow>(
    sql`select * from public.reserve_v2_public_session_start(${practiceId}::uuid)`,
  );
  const reservation = result[0];

  if (!reservation) {
    throw new Error('Public-session start reservation returned no result.');
  }

  return {
    allowed: reservation.allowed,
    used: Number(reservation.used),
    limit: Number(reservation.start_limit),
    retryAfterSeconds: Number(reservation.retry_after_seconds),
  };
}
