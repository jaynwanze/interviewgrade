'use client';

import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { V2PracticeHistoryList } from '@/components/Interviews/InterviewHistory/V2PracticeHistoryList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useInterviewHistory } from '@/hooks/useInterviewHistory';
import type { CandidateSessionHistoryItem } from '@/modules/session/candidate-session-history';
import { useMemo } from 'react';

export default function InterviewHistoryPage({
  v2Sessions,
}: {
  v2Sessions: CandidateSessionHistoryItem[];
}) {
  const {
    filteredInterviews,
    activeTab,
    activeSwitch,
    counts,
    loading,
    error,
    handleTabChange,
    handleSwitchChange,
  } = useInterviewHistory();

  const filteredV2Sessions = useMemo(() => {
    if (activeSwitch !== 'Practice Mode') {
      return [];
    }

    return v2Sessions.filter((session) => {
      switch (activeTab) {
        case 'Completed':
          return session.status === 'completed';
        case 'Not Completed':
          return session.status === 'in_progress' || session.status === 'abandoned';
        case 'Not Started':
          return session.status === 'created';
        case 'All':
        default:
          return true;
      }
    });
  }, [activeSwitch, activeTab, v2Sessions]);

  const combinedCounts = useMemo(() => {
    if (activeSwitch !== 'Practice Mode') {
      return counts;
    }

    return {
      all: counts.all + v2Sessions.length,
      completed:
        counts.completed +
        v2Sessions.filter((session) => session.status === 'completed').length,
      notCompleted:
        counts.notCompleted +
        v2Sessions.filter(
          (session) =>
            session.status === 'in_progress' || session.status === 'abandoned',
        ).length,
      notStarted:
        counts.notStarted +
        v2Sessions.filter((session) => session.status === 'created').length,
    };
  }, [activeSwitch, counts, v2Sessions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && v2Sessions.length === 0) {
    return <div className="text-center p-4">{error}</div>;
  }

  const showLegacyList =
    filteredInterviews.length > 0 || filteredV2Sessions.length === 0;

  return (
    <div className="max-w-5xl mx-auto">
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
          counts={combinedCounts}
          onTabChange={handleTabChange}
        />

        <Label htmlFor="history-mode" className="text-sm font-medium">
          {activeSwitch === 'Interview Mode' ? 'Interview Mode' : 'Practice Mode'}
        </Label>
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
      </div>
      <Separator className="my-4" />

      {error && v2Sessions.length > 0 && (
        <div className="mx-auto mb-4 w-full max-w-4xl rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          Older interview history could not be loaded, but your new Practice
          sessions are still available below.
        </div>
      )}

      <div className="space-y-6">
        {activeSwitch === 'Practice Mode' && (
          <V2PracticeHistoryList sessions={filteredV2Sessions} />
        )}

        {showLegacyList && (
          <InterviewHistoryList
            interviews={filteredInterviews}
            interviewModeToggle={activeSwitch}
          />
        )}
      </div>
    </div>
  );
}
