import 'server-only';

import { sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

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

type PracticeGenerationUsageRow = {
  is_pro: boolean;
  used: number;
  resets_at: Date | string;
};

export type PracticeGenerationReservation = {
  allowed: boolean;
  plan: PracticeGenerationPlan;
  used: number;
  limit: number;
  remaining: number;
};

export type V2PracticeGenerationUsage = {
  plan: PracticeGenerationPlan;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
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

export async function getCurrentV2PracticeGenerationUsage(): Promise<V2PracticeGenerationUsage> {
  const user = await serverGetLoggedInUser();

  const result = await db.execute<PracticeGenerationUsageRow>(sql`
    select
      exists (
        select 1
        from public.subscriptions s
        where s.candidate_id = ${user.id}::uuid
          and s.status::text in ('active', 'trialing')
      ) as is_pro,
      (
        select count(*)::int
        from public.practice_generation_usage pgu
        where pgu.user_id = ${user.id}::uuid
          and pgu.consumed_at >= date_trunc('month', now())
          and pgu.consumed_at < date_trunc('month', now()) + interval '1 month'
      ) as used,
      date_trunc('month', now()) + interval '1 month' as resets_at
  `);

  const row = result[0];
  if (!row) {
    throw new Error('Could not load V2 Practice generation usage.');
  }

  const plan: PracticeGenerationPlan = row.is_pro ? 'pro' : 'free';
  const used = Number(row.used);
  const limit = V2_PRACTICE_GENERATION_LIMITS[plan];
  const resetsAt = new Date(row.resets_at);

  if (!Number.isFinite(used) || Number.isNaN(resetsAt.getTime())) {
    throw new Error('Invalid V2 Practice generation usage returned by the database.');
  }

  return {
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: resetsAt.toISOString(),
  };
}
