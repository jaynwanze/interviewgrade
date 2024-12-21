'use client';

import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Label } from '@/components/ui/label';
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Interview History</h1>
      <div className="flex justify-center items-center space-x-2 mb-4">
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
        <Label htmlFor="history-mode">
          {memoizedValues.activeSwitch === 'Interview Mode'
            ? 'Interview Mode'
            : 'Practice Mode'}
        </Label>
      </div>
      <InterviewHistoryFilter
        activeTab={memoizedValues.activeTab}
        counts={memoizedValues.counts}
        onTabChange={memoizedValues.handleTabChange}
      />
      <InterviewHistoryList interviews={memoizedValues.filteredInterviews} />
    </div>
  );
}
