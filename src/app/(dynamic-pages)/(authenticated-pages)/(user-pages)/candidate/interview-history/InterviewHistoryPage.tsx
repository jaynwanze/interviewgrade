'use client';

import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useInterviewHistory } from '@/hooks/useInterviewHistory';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4">{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Interview History</h1>
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="history-mode"
          checked={activeSwitch === 'Interview Mode'}
          onCheckedChange={() =>
            handleSwitchChange(
              activeSwitch === 'Practice Mode'
                ? 'Interview Mode'
                : 'Practice Mode',
            )
          }
        />
        <Label htmlFor="history-mode">
          {activeSwitch === 'Interview Mode'
            ? 'Interview Mode'
            : 'Practice Mode'}
        </Label>
      </div>

      <InterviewHistoryFilter
        activeTab={activeTab}
        counts={counts}
        onTabChange={handleTabChange}
      />
      <InterviewHistoryList interviews={filteredInterviews} />
    </div>
  );
}
