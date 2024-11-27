'use client';
import { getInterviewHistory } from '@/data/user/interviews';
import { Interview } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { useEffect, useState } from 'react';

export const useInterviewHistory = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [activeTab, setActiveTab] = useState<
    'All' | 'Completed' | 'Not Completed' | 'Not Started'
  >('All');
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
      setError(error || 'Failed to fetch interview history');
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
    switch (tab) {
      case 'All':
        setFilteredInterviews(interviews);
        break;
      case 'Completed':
        setFilteredInterviews(
          interviews.filter((i) => i.status === 'completed'),
        );
        break;
      case 'Not Completed':
        setFilteredInterviews(
          interviews.filter((i) => i.status === 'in_progress'),
        );
        break;
      case 'Not Started':
        setFilteredInterviews(
          interviews.filter((i) => i.status === 'not_started'),
        );
        break;
      default:
        setFilteredInterviews(interviews);
    }
  };

  return {
    interviews,
    filteredInterviews,
    activeTab,
    counts,
    loading,
    error,
    handleTabChange,
  };
};
