import type {
  LegacyCandidateHistoryPage,
  LegacyHistoryFilter,
  LegacyHistoryMode,
} from '@/modules/session/legacy-candidate-history';
import type {
  CandidateSessionHistoryFilter,
  CandidateSessionHistoryPage,
} from '@/modules/session/candidate-session-history';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import InterviewHistoryPage from './InterviewHistoryPage';

const PAGE_SIZE = 5;

type HistorySearchParams = Record<string, string | string[] | undefined>;

export default async function InterviewHistory({
  searchParams,
}: {
  searchParams?: HistorySearchParams;
}) {
  const user = await serverGetLoggedInUser();
  const legacyView = firstValue(searchParams?.legacy) === '1';
  const legacyMode = parseMode(searchParams?.mode);
  const filter = parseFilter(searchParams?.status);
  const page = parsePage(searchParams?.page);

  const v2Result = legacyView
    ? { page: emptyV2Page(), error: false }
    : await loadV2Page(user.id, filter, page);
  const legacyResult = legacyView
    ? await loadLegacyPage(user.id, legacyMode, filter, page)
    : { page: emptyLegacyPage(), error: false };

  return (
    <InterviewHistoryPage
      legacyView={legacyView}
      legacyMode={legacyMode}
      filter={filter}
      v2Page={v2Result.page}
      legacyPage={legacyResult.page}
      v2Error={v2Result.error}
      legacyError={legacyResult.error}
    />
  );
}

async function loadV2Page(
  userId: string,
  filter: CandidateSessionHistoryFilter,
  page: number,
): Promise<{ page: CandidateSessionHistoryPage; error: boolean }> {
  try {
    const { getCandidateSessionHistoryPage } = await import(
      '@/modules/session/candidate-session-history'
    );
    return {
      page: await getCandidateSessionHistoryPage(userId, {
        filter,
        page,
        pageSize: PAGE_SIZE,
      }),
      error: false,
    };
  } catch (error) {
    console.error('InterviewHistory: v2 session history unavailable', error);
    return { page: emptyV2Page(), error: true };
  }
}

async function loadLegacyPage(
  userId: string,
  mode: LegacyHistoryMode,
  filter: LegacyHistoryFilter,
  page: number,
): Promise<{ page: LegacyCandidateHistoryPage; error: boolean }> {
  try {
    const { getLegacyCandidateHistoryPage } = await import(
      '@/modules/session/legacy-candidate-history'
    );
    return {
      page: await getLegacyCandidateHistoryPage(userId, {
        mode,
        filter,
        page,
        pageSize: PAGE_SIZE,
      }),
      error: false,
    };
  } catch (error) {
    console.error('InterviewHistory: legacy history unavailable', error);
    return { page: emptyLegacyPage(), error: true };
  }
}

function parseMode(value: string | string[] | undefined): LegacyHistoryMode {
  return firstValue(value) === 'interview' ? 'interview' : 'practice';
}

function parseFilter(
  value: string | string[] | undefined,
): CandidateSessionHistoryFilter {
  const filter = firstValue(value);
  if (
    filter === 'completed' ||
    filter === 'not_completed' ||
    filter === 'not_started'
  ) {
    return filter;
  }
  return 'all';
}

function parsePage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function emptyV2Page(): CandidateSessionHistoryPage {
  return {
    items: [],
    counts: { all: 0, completed: 0, notCompleted: 0, notStarted: 0 },
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  };
}

function emptyLegacyPage(): LegacyCandidateHistoryPage {
  return {
    items: [],
    counts: { all: 0, completed: 0, notCompleted: 0, notStarted: 0 },
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  };
}
