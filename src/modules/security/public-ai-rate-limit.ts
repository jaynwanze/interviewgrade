import 'server-only';

import { createHash } from 'node:crypto';

import { sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { db, type InterviewGradeDatabase } from '@/db/client';

type PublicAiOperation = 'tts' | 'transcribe';

type ReservationRow = {
  allowed: boolean;
  used: number;
  request_limit: number;
  retry_after_seconds: number;
};

export type PublicAiReservation = {
  allowed: boolean;
  used: number;
  limit: number;
  retryAfterSeconds: number;
};

function getClientAddress(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const firstForwarded = forwarded?.split(',')[0]?.trim();
  return firstForwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function getPublicAiRateKey(request: NextRequest) {
  return createHash('sha256')
    .update(`interviewgrade-public-ai:${getClientAddress(request)}`)
    .digest('hex');
}

export async function reservePublicAiRequest(
  request: NextRequest,
  operation: PublicAiOperation,
  database: InterviewGradeDatabase = db,
): Promise<PublicAiReservation> {
  const rateKey = getPublicAiRateKey(request);
  const result = await database.execute<ReservationRow>(
    sql`select * from public.reserve_v2_ai_request(${rateKey}, ${operation})`,
  );
  const reservation = result[0];

  if (!reservation) {
    throw new Error('Public AI rate-limit reservation returned no result.');
  }

  return {
    allowed: reservation.allowed,
    used: Number(reservation.used),
    limit: Number(reservation.request_limit),
    retryAfterSeconds: Number(reservation.retry_after_seconds),
  };
}
