import 'server-only';

import { sql } from 'drizzle-orm';

import { db } from '@/db/client';

export type PracticeGenerationSourceKind = 'brief' | 'document';
export type PracticeGenerationPlan = 'free' | 'pro';

export const V2_PRACTICE_GENERATION_LIMITS: Record<
  PracticeGenerationPlan,
  number
> = {
  free: 3,
  pro: 50,
};

type PracticeGenerationReservationRow = {
  allowed: boolean;
  plan: string;
  used: number;
  generation_limit: number;
};

export type PracticeGenerationReservation = {
  allowed: boolean;
  plan: PracticeGenerationPlan;
  used: number;
  limit: number;
  remaining: number;
};

export async function reserveV2PracticeGeneration(
  userId: string,
  sourceKind: PracticeGenerationSourceKind,
): Promise<PracticeGenerationReservation> {
  const result = await db.execute<PracticeGenerationReservationRow>(sql`
    select *
    from public.reserve_v2_practice_generation(
      ${userId}::uuid,
      ${sourceKind}::text
    )
  `);
  const row = result[0];

  if (!row) {
    throw new Error('Practice generation reservation returned no result.');
  }

  const plan: PracticeGenerationPlan = row.plan === 'pro' ? 'pro' : 'free';
  const used = Number(row.used);
  const limit = Number(row.generation_limit);

  if (!Number.isFinite(used) || !Number.isFinite(limit)) {
    throw new Error('Invalid Practice generation usage returned by the database.');
  }

  return {
    allowed: row.allowed,
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}
