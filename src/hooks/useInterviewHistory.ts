import { getInterviewHistory } from '@/data/user/interviews';
import { Interview } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';

export const useInterviewHistory = (knownUserId?: string) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [activeTab, setActiveTab] = useState<
    'All' | 'Completed' | 'Not Completed' | 'Not Started'
  >('All');
  const [activeSwitch, setActiveSwitch] = useState<
    'Practice Mode' | 'Interview Mode'
  >('Practice Mode');
  const [counts, setCounts] = useState({
    all: 0,
    completed: 0,
    notCompleted: 0,
    notStarted: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviewHistory = async () => {
    try {
      const userId =
        knownUserId ?? (await serverGetLoggedInUser()).id;
      const data = await getInterviewHistory(userId);
      if (!data) {
        setInterviews([]);
        setFilteredInterviews([]);
        return;
      }
      setInterviews(data);
      setFilteredInterviews(data);
    } catch (caughtError) {
      console.error('Error fetching interview history:', caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to fetch interview history',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInterviewHistory();
  }, []);

  const handleTabChange = (
    tab: 'All' | 'Completed' | 'Not Completed' | 'Not Started',
  ) => {
    setActiveTab(tab);
  };

  const handleSwitchChange = (
    switchMode: 'Practice Mode' | 'Interview Mode',
  ) => {
    setActiveSwitch(switchMode);
  };

  useEffect(() => {
    let filtered = [...interviews];

    if (activeSwitch === 'Practice Mode') {
      filtered = filtered.filter((i) => i.mode === 'practice');
    } else {
      filtered = filtered.filter((i) => i.mode === 'interview');
    }

    setCounts({
      all: filtered.length,
      completed: filtered.filter((i) => i.status === 'completed').length,
      notCompleted: filtered.filter((i) => i.status === 'in_progress').length,
      notStarted: filtered.filter((i) => i.status === 'not_started').length,
    });

    switch (activeTab) {
      case 'Completed':
        filtered = filtered.filter((i) => i.status === 'completed');
        break;
      case 'Not Completed':
        filtered = filtered.filter((i) => i.status === 'in_progress');
        break;
      case 'Not Started':
        filtered = filtered.filter((i) => i.status === 'not_started');
        break;
      case 'All':
      default:
        break;
    }

    setFilteredInterviews(filtered);
  }, [activeTab, activeSwitch, interviews]);

  return {
    interviews,
    filteredInterviews,
    activeSwitch,
    activeTab,
    counts,
    loading,
    error,
    handleTabChange,
    handleSwitchChange,
  };
};
