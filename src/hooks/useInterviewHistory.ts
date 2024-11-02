'use client';
import { Interview } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';

export const useInterviewHistory = ({ candidateId }: {candidateId : string}) => {
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

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/interviews/history', {
        params: { candidate_id: candidateId },
      });
      const data: Interview[] = response.data;
      setInterviews(data);
      setFilteredInterviews(data);
      setCounts({
        all: data.length,
        completed: data.filter((i) => i.status === 'not_started').length,
        notCompleted: data.filter((i) => i.status === 'in_progress').length,
        notStarted: data.filter((i) => i.status === 'completed').length,
      });
    } catch (err: any) {
      console.error(
        'Error fetching interview history:',
        err.response?.data?.error || err.message,
      );
      setError(
        err.response?.data?.error || 'Failed to fetch interview history',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [candidateId]);

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
          interviews.filter((i) => i.status === 'not_started'),
        );
        break;
      case 'Not Completed':
        setFilteredInterviews(
          interviews.filter((i) => i.status === 'in_progress'),
        );
        break;
      case 'Not Started':
        setFilteredInterviews(
          interviews.filter((i) => i.status === 'completed'),
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
    fetchInterviews, // Exposed for re-fetching if needed
  };
};