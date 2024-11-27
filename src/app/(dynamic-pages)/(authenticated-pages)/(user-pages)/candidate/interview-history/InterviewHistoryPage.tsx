'use client';
import { InterviewHistoryFilter } from '@/components/Interviews/InterviewHistory/InterviewHistoryFilter';
import { InterviewHistoryList } from '@/components/Interviews/InterviewHistory/InterviewHistoryList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useInterviewHistory } from '@/hooks/useInterviewHistory';

export default function InterviewHistoryPage() {
  const {
    interviews,
    filteredInterviews,
    activeTab,
    counts,
    loading,
    error,
    handleTabChange,
  } = useInterviewHistory();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center p-4">{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Interview History</h1>
      <InterviewHistoryFilter
        activeTab={activeTab}
        counts={counts}
        onTabChange={handleTabChange}
      />
      <InterviewHistoryList interviews={filteredInterviews} />
    </div>
  );
}
