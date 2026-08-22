'use client';

import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { V2PracticeHistoryList } from '@/components/Interviews/InterviewHistory/V2PracticeHistoryList';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type {
  LegacyCandidateHistoryPage,
  LegacyHistoryMode,
} from '@/modules/session/legacy-candidate-history';
import type {
  CandidateSessionHistoryFilter,
  CandidateSessionHistoryPage,
} from '@/modules/session/candidate-session-history';
import { Archive, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const tabByFilter = {
  all: 'All',
  completed: 'Completed',
  not_completed: 'Not Completed',
  not_started: 'Not Started',
} as const;

type HistoryTab = (typeof tabByFilter)[keyof typeof tabByFilter];

export default function InterviewHistoryPage({
  legacyView,
  legacyMode,
  filter,
  v2Page,
  legacyPage,
  v2Error,
  legacyError,
}: {
  legacyView: boolean;
  legacyMode: LegacyHistoryMode;
  filter: CandidateSessionHistoryFilter;
  v2Page: CandidateSessionHistoryPage;
  legacyPage: LegacyCandidateHistoryPage;
  v2Error: boolean;
  legacyError: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeTab = tabByFilter[filter];
  const activeSwitch =
    legacyMode === 'interview' ? 'Interview Mode' : 'Practice Mode';
  const counts = legacyView ? legacyPage.counts : v2Page.counts;

  const replaceParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(
        query
          ? `/candidate/interview-history?${query}`
          : '/candidate/interview-history',
      );
    });
  };

  const handleTabChange = (tab: HistoryTab) => {
    replaceParams({ status: filterForTab(tab), page: '1' });
  };

  const handleLegacyModeChange = () => {
    replaceParams({
      mode: legacyMode === 'practice' ? 'interview' : 'practice',
      page: '1',
    });
  };

  return (
    <div className={`mx-auto max-w-5xl ${isPending ? 'opacity-70' : ''}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {legacyView ? 'Legacy history' : 'History'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {legacyView
              ? 'Sessions from the original InterviewGrade interview and practice runtime.'
              : 'Review your Practice attempts, continue unfinished sessions, and open completed reports.'}
          </p>
        </div>

        {legacyView ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/candidate/interview-history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/candidate/interview-history?legacy=1">
              <Archive className="mr-2 h-4 w-4" />
              Legacy history
            </Link>
          </Button>
        )}
      </div>

      <Separator className="my-5" />

      {legacyView && (
        <div className="mb-5 rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          This archive is kept for access to sessions created before the V2 Practice
          runtime. It is not combined with current Practice scores or analytics.
        </div>
      )}

      <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
        <InterviewHistoryFilter
          activeTab={activeTab}
          counts={counts}
          onTabChange={handleTabChange}
        />

        {legacyView && (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Label htmlFor="history-mode" className="text-sm font-medium">
              {activeSwitch}
            </Label>
            <Switch
              id="history-mode"
              checked={legacyMode === 'interview'}
              disabled={isPending}
              onCheckedChange={handleLegacyModeChange}
            />
          </div>
        )}
      </div>

      <Separator className="my-5" />

      {!legacyView && v2Error && (
        <StatusNotice>
          Practice history could not be loaded right now. Please refresh and try
          again.
        </StatusNotice>
      )}
      {legacyView && legacyError && (
        <StatusNotice>
          Legacy history could not be loaded right now. Your current V2 Practice
          history is unaffected.
        </StatusNotice>
      )}

      {!legacyView && !v2Error && (
        <div className="space-y-5">
          {v2Page.totalItems > 0 ? (
            <>
              <V2PracticeHistoryList
                sessions={v2Page.items}
                totalCount={v2Page.totalItems}
              />
              <HistoryPager
                label="Practice sessions"
                page={v2Page.page}
                totalPages={v2Page.totalPages}
                disabled={isPending}
                onPageChange={(page) => replaceParams({ page: String(page) })}
              />
            </>
          ) : (
            <EmptyHistory>
              No Practice sessions found for this filter.
            </EmptyHistory>
          )}
        </div>
      )}

      {legacyView && !legacyError && (
        <div className="space-y-5">
          {legacyPage.totalItems > 0 ? (
            <>
              <InterviewHistoryList
                interviews={legacyPage.items}
                interviewModeToggle={activeSwitch}
              />
              <HistoryPager
                label={
                  legacyMode === 'interview'
                    ? 'Legacy interviews'
                    : 'Legacy Practice sessions'
                }
                page={legacyPage.page}
                totalPages={legacyPage.totalPages}
                disabled={isPending}
                onPageChange={(page) => replaceParams({ page: String(page) })}
              />
            </>
          ) : (
            <EmptyHistory>
              No legacy {legacyMode === 'interview' ? 'interviews' : 'Practice sessions'}{' '}
              found for this filter.
            </EmptyHistory>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryPager({
  label,
  page,
  totalPages,
  disabled,
  onPageChange,
}: {
  label: string;
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-xs text-muted-foreground">
        {label}: page {page} of {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function StatusNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-4 w-full max-w-4xl rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
      {children}
    </div>
  );
}

function EmptyHistory({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function filterForTab(tab: HistoryTab): CandidateSessionHistoryFilter {
  switch (tab) {
    case 'Completed':
      return 'completed';
    case 'Not Completed':
      return 'not_completed';
    case 'Not Started':
      return 'not_started';
    case 'All':
    default:
      return 'all';
  }
}
