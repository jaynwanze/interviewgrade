'use client';

import { InterviewAnalyticsGrid } from '@/components/Interviews/InterviewAnalytics/InterviewAnalyticsGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { InterviewAnalytics } from '@/types';
import { useState } from 'react';
import { InterviewGraphs } from './_graphs/InterviewGraphs';

const mockAnalyticsData: InterviewAnalytics[] = [
  {
    id: 'a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14',
    candidate_id: 'c1d2e3f4-g5h6-i7j8-k9l10-m11n12o13p14',
    template_id: 't1u2v3w4-x5y6-z7a8-b9c10-d11e12f13g14',
    interview_title: 'Senior Software Engineer Interview',
    interview_description:
      'Interview for the Senior Software Engineer position focusing on system design and algorithms.',
    period_start: '2023-01-01',
    period_end: '2023-01-31',
    total_interviews: 25,
    avg_overall_score: 85.75,
    avg_evaluation_criteria_scores: [
      {
        id: 'c1d2e3f4-g5h6-i7j8-k9l10-m11n12o13p14',
        name: 'Technical Knowledge',
        avg_score: 9.5,
        feedback_summary: [
          'Strong understanding of data structures.',
          'Excellent grasp of system design principles.',
        ],
      },
      {
        id: 'q1r2s3t4-u5v6-w7x8-y9z10-a11b12c13d14',
        name: 'Problem Solving',
        avg_score: 8.3,
        feedback_summary: [
          'Good problem-solving skills but can improve efficiency.',
          'Approaches problems methodically.',
        ],
      },
      {
        id: 'e1f2g3h4-i5j6-k7l8-m9n10-o11p12q13r14',
        name: 'Communication',
        avg_score: 7.2,
        feedback_summary: [
          'Clear and concise communication.',
          'Effectively explains complex concepts.',
        ],
      },
    ],
    strengths_summary: [
      'Excellent technical knowledge.',
      'Strong system design skills.',
      'Effective communicator.',
    ],
    areas_for_improvement_summary: [
      'Improve problem-solving speed.',
      'Enhance coding efficiency.',
    ],
    recommendations_summary: [
      'Provide more real-world system design examples.',
      'Practice solving problems under time constraints.',
    ],
    created_at: '2023-02-05T10:15:30Z',
    updated_at: '2023-02-10T14:22:45Z',
  },
  // ... Include other mock records as needed
];

export default function InterviewAnaltyicsPage() {
  const [analyticsData, setAnalyticsData] = useState<InterviewAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    interview_title: '',
    searchQuery: '',
  });

  /*
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data from the server
      } catch (error) {
        setError(error || 'Failed to fetch analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);
  */

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Interview Analytics Dashboard
      </h1>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-center">{error}</p>
      ) : (
        <div>
          <InterviewAnalyticsGrid analyticsData={mockAnalyticsData} />
          <InterviewGraphs />
        </div>
      )}
    </div>
  );
}
