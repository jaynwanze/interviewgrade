'use client';

import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useInterviewHistory } from '@/hooks/useInterviewHistory';
import { useMemo } from 'react';

export default function InterviewHistoryPage() {
  const {
    interviews,
    filteredInterviews,
    activeTab,
    activeSwitch,
    counts,
    loading,
    error,
    handleTabChange,
    handleSwitchChange,
  } = useInterviewHistory();

  const memoizedValues = useMemo(
    () => ({
      interviews,
      filteredInterviews,
      activeTab,
      activeSwitch,
      counts,
      loading,
      error,
      handleTabChange,
      handleSwitchChange,
    }),
    [
      interviews,
      filteredInterviews,
      activeTab,
      activeSwitch,
      counts,
      loading,
      error,
    ],
  );

  if (memoizedValues.loading) {
    return (
      <div className="flex flex-col items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (memoizedValues.error) {
    return <div className="text-center p-4">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Interview History</h1>
        <p className="text-gray-500">
          Review your past interviews and practice sessions.
        </p>
      </div>

      <Separator className="my-4" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      {/* Filters */}
        <InterviewHistoryFilter
          activeTab={memoizedValues.activeTab}
          counts={memoizedValues.counts}
          onTabChange={memoizedValues.handleTabChange}
        />

        {/* Mode Toggle */}
        <Label htmlFor="history-mode" className="text-sm font-medium">
          {memoizedValues.activeSwitch === 'Interview Mode'
            ? 'Interview Mode'
            : 'Practice Mode'}
        </Label>
        <Switch
          id="history-mode"
          checked={memoizedValues.activeSwitch === 'Interview Mode'}
          onCheckedChange={() =>
            handleSwitchChange(
              memoizedValues.activeSwitch === 'Practice Mode'
                ? 'Interview Mode'
                : 'Practice Mode',
            )
          }
        />
      </div>
      <Separator className="my-4 " />

      {/* Interview List */}
      <InterviewHistoryList
        interviews={memoizedValues.filteredInterviews}
        interviewModeToggle={memoizedValues.activeSwitch}
      />
    </div>
  );
}
