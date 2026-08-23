import 'server-only';

import { sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

export type V2Plan = 'free' | 'pro';

export const V2_PRACTICE_RUN_LIMITS: Record<V2Plan, number> = {
  free: 3,
  pro: 30,
};

type PracticeRunUsageRow = {
  is_pro: boolean;
  used: number;
  resets_at: Date | string;
};

export type V2PracticeRunUsage = {
  plan: V2Plan;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
};

/**
 * Read the same subscription semantics used by the V2 reservation function:
 * active/trialing = Pro, everything else = Free. Usage is counted in the same
 * database calendar-month window as `reserve_v2_practice_run` so the UI cannot
 * drift from enforcement because of application-server timezone differences.
 */
export async function getCurrentV2PracticeRunUsage(): Promise<V2PracticeRunUsage> {
  const user = await serverGetLoggedInUser();

  const result = await db.execute<PracticeRunUsageRow>(sql`
    select
      exists (
        select 1
        from public.subscriptions s
        where s.candidate_id = ${user.id}::uuid
          and s.status::text in ('active', 'trialing')
      ) as is_pro,
      (
        select count(*)::int
        from public.practice_run_usage pru
        where pru.funder_user_id = ${user.id}::uuid
          and pru.consumed_at >= date_trunc('month', now())
          and pru.consumed_at < date_trunc('month', now()) + interval '1 month'
      ) as used,
      date_trunc('month', now()) + interval '1 month' as resets_at
  `);

  const row = result[0];
  if (!row) {
    throw new Error('Could not load V2 Practice run usage.');
  }

  const plan: V2Plan = row.is_pro ? 'pro' : 'free';
  const used = Number(row.used);
  const limit = V2_PRACTICE_RUN_LIMITS[plan];
  const resetsAt = new Date(row.resets_at);

  if (!Number.isFinite(used) || Number.isNaN(resetsAt.getTime())) {
    throw new Error('Invalid V2 Practice run usage returned by the database.');
  }

  return {
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: resetsAt.toISOString(),
  };
}
