import { useEffect, useState } from 'react';
import { getInterviewHistory } from '@/data/user/interviews';
import { Interview } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

export const useInterviewHistory = () => {
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
      const user = await serverGetLoggedInUser();
      const userId = user.id;
      const data = await getInterviewHistory(userId);
      if (!data) {
        console.error('No interview history found');
        return;
      }
      setInterviews(data);
      setFilteredInterviews(data);
      setCounts({
        all: data.length,
        completed: data.filter((i) => i.status === 'completed').length,
        notCompleted: data.filter((i) => i.status === 'in_progress').length,
        notStarted: data.filter((i) => i.status === 'not_started').length,
      });
    } catch (error) {
      console.error('Error fetching interview history:', error);
      setError(error.message || 'Failed to fetch interview history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewHistory();
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

  // Apply filters whenever activeTab or activeSwitch changes
  useEffect(() => {
    let filtered = [...interviews];

    // Filter based on activeSwitch
    if (activeSwitch === 'Practice Mode') {
      filtered = filtered.filter((i) => i.mode === 'practice');
    } else if (activeSwitch === 'Interview Mode') {
      filtered = filtered.filter((i) => i.mode === 'interview');
    }

    // Further filter based on activeTab
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
        // No additional filtering
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
