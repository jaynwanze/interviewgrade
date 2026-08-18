'use client';

import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { V2PracticeHistoryList } from '@/components/Interviews/InterviewHistory/V2PracticeHistoryList';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type {
  LegacyCandidateHistoryCounts,
  LegacyCandidateHistoryPage,
  LegacyHistoryFilter,
  LegacyHistoryMode,
} from '@/modules/session/legacy-candidate-history';
import type {
  CandidateSessionHistoryCounts,
  CandidateSessionHistoryPage,
} from '@/modules/session/candidate-session-history';
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
  mode,
  filter,
  v2Page,
  legacyPage,
  v2Error,
  legacyError,
}: {
  mode: LegacyHistoryMode;
  filter: LegacyHistoryFilter;
  v2Page: CandidateSessionHistoryPage;
  legacyPage: LegacyCandidateHistoryPage;
  v2Error: boolean;
  legacyError: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeTab = tabByFilter[filter];
  const activeSwitch = mode === 'interview' ? 'Interview Mode' : 'Practice Mode';
  const counts =
    mode === 'practice'
      ? combineCounts(v2Page.counts, legacyPage.counts)
      : legacyPage.counts;

  const replaceParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    startTransition(() => {
      router.replace(`/candidate/interview-history?${params.toString()}`);
    });
  };

  const handleTabChange = (tab: HistoryTab) => {
    replaceParams({
      status: filterForTab(tab),
      v2Page: '1',
      legacyPage: '1',
    });
  };

  const handleSwitchChange = () => {
    replaceParams({
      mode: mode === 'practice' ? 'interview' : 'practice',
      v2Page: '1',
      legacyPage: '1',
    });
  };

  return (
    <div className={`max-w-5xl mx-auto ${isPending ? 'opacity-70' : ''}`}>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Interview History</h1>
        <p className="text-gray-500">
          Review your past interviews and practice sessions.
        </p>
      </div>

      <Separator className="my-4" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        <InterviewHistoryFilter
          activeTab={activeTab}
          counts={counts}
          onTabChange={handleTabChange}
        />

        <Label htmlFor="history-mode" className="text-sm font-medium">
          {activeSwitch}
        </Label>
        <Switch
          id="history-mode"
          checked={mode === 'interview'}
          disabled={isPending}
          onCheckedChange={handleSwitchChange}
        />
      </div>
      <Separator className="my-4" />

      {v2Error && mode === 'practice' && (
        <StatusNotice>
          New Practice history could not be loaded. Older Practice history is
          still available below.
        </StatusNotice>
      )}
      {legacyError && (
        <StatusNotice>
          Older interview history could not be loaded. New Practice sessions
          remain available when applicable.
        </StatusNotice>
      )}

      <div className="space-y-8">
        {mode === 'practice' && v2Page.totalItems > 0 && (
          <section className="space-y-4">
            <V2PracticeHistoryList
              sessions={v2Page.items}
              totalCount={v2Page.totalItems}
            />
            <HistoryPager
              label="New Practice sessions"
              page={v2Page.page}
              totalPages={v2Page.totalPages}
              disabled={isPending}
              onPageChange={(page) =>
                replaceParams({ v2Page: String(page) })
              }
            />
          </section>
        )}

        {!legacyError && (legacyPage.totalItems > 0 || mode === 'interview') && (
          <section className="space-y-4">
            {mode === 'practice' && legacyPage.totalItems > 0 && (
              <div className="mx-auto w-full max-w-4xl px-1">
                <h2 className="text-sm font-semibold">Earlier Practice Sessions</h2>
                <p className="text-xs text-muted-foreground">
                  Sessions from the original InterviewGrade practice runtime.
                </p>
              </div>
            )}
            <InterviewHistoryList
              interviews={legacyPage.items}
              interviewModeToggle={activeSwitch}
            />
            <HistoryPager
              label={mode === 'interview' ? 'Interviews' : 'Earlier Practice sessions'}
              page={legacyPage.page}
              totalPages={legacyPage.totalPages}
              disabled={isPending}
              onPageChange={(page) =>
                replaceParams({ legacyPage: String(page) })
              }
            />
          </section>
        )}

        {mode === 'practice' &&
          !v2Error &&
          !legacyError &&
          v2Page.totalItems === 0 &&
          legacyPage.totalItems === 0 && (
            <div className="mx-auto max-w-2xl rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No Practice sessions found for this filter.
            </div>
          )}
      </div>
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

function combineCounts(
  v2: CandidateSessionHistoryCounts,
  legacy: LegacyCandidateHistoryCounts,
) {
  return {
    all: v2.all + legacy.all,
    completed: v2.completed + legacy.completed,
    notCompleted: v2.notCompleted + legacy.notCompleted,
    notStarted: v2.notStarted + legacy.notStarted,
  };
}

function filterForTab(tab: HistoryTab): LegacyHistoryFilter {
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
