import 'server-only';

import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type { Interview } from '@/types';

export type LegacyHistoryMode = 'practice' | 'interview';
export type LegacyHistoryFilter =
  | 'all'
  | 'completed'
  | 'not_completed'
  | 'not_started';

export type LegacyCandidateHistoryItem = Pick<
  Interview,
  'id' | 'title' | 'status' | 'start_time' | 'end_time' | 'mode'
>;

export type LegacyCandidateHistoryCounts = {
  all: number;
  completed: number;
  notCompleted: number;
  notStarted: number;
};

export type LegacyCandidateHistoryPage = {
  items: LegacyCandidateHistoryItem[];
  counts: LegacyCandidateHistoryCounts;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Fetch only the legacy history rows required for the visible page. Counts are
 * resolved with HEAD requests, so filtering tabs no longer requires downloading
 * the candidate's complete interview history first.
 */
export async function getLegacyCandidateHistoryPage(
  candidateId: string,
  options: {
    mode: LegacyHistoryMode;
    filter?: LegacyHistoryFilter;
    page?: number;
    pageSize?: number;
  },
): Promise<LegacyCandidateHistoryPage> {
  const normalizedCandidateId = candidateId.trim();
  if (!normalizedCandidateId) {
    throw new Error('A candidate id is required to load legacy history.');
  }

  const filter = options.filter ?? 'all';
  const pageSize = Math.min(25, Math.max(1, Math.trunc(options.pageSize ?? 5)));
  const requestedPage = Math.max(1, Math.trunc(options.page ?? 1));
  const supabase = createSupabaseUserServerComponentClient();

  const [allCount, completedCount, notCompletedCount, notStartedCount] =
    await Promise.all([
      countHistory(supabase, normalizedCandidateId, options.mode, 'all'),
      countHistory(supabase, normalizedCandidateId, options.mode, 'completed'),
      countHistory(supabase, normalizedCandidateId, options.mode, 'not_completed'),
      countHistory(supabase, normalizedCandidateId, options.mode, 'not_started'),
    ]);

  const counts: LegacyCandidateHistoryCounts = {
    all: allCount,
    completed: completedCount,
    notCompleted: notCompletedCount,
    notStarted: notStartedCount,
  };
  const totalItems = countForFilter(counts, filter);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('interviews')
    .select('id,title,status,start_time,end_time,mode')
    .eq('candidate_id', normalizedCandidateId)
    .eq('mode', options.mode)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'not_completed') {
    query = query.eq('status', 'in_progress');
  } else if (filter === 'not_started') {
    query = query.eq('status', 'not_started');
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return {
    items: (data ?? []) as LegacyCandidateHistoryItem[],
    counts,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

type SupabaseServerClient = ReturnType<
  typeof createSupabaseUserServerComponentClient
>;

async function countHistory(
  supabase: SupabaseServerClient,
  candidateId: string,
  mode: LegacyHistoryMode,
  filter: LegacyHistoryFilter,
) {
  let query = supabase
    .from('interviews')
    .select('id', { count: 'exact', head: true })
    .eq('candidate_id', candidateId)
    .eq('mode', mode);

  if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'not_completed') {
    query = query.eq('status', 'in_progress');
  } else if (filter === 'not_started') {
    query = query.eq('status', 'not_started');
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }
  return count ?? 0;
}

function countForFilter(
  counts: LegacyCandidateHistoryCounts,
  filter: LegacyHistoryFilter,
) {
  switch (filter) {
    case 'completed':
      return counts.completed;
    case 'not_completed':
      return counts.notCompleted;
    case 'not_started':
      return counts.notStarted;
    case 'all':
    default:
      return counts.all;
  }
}
