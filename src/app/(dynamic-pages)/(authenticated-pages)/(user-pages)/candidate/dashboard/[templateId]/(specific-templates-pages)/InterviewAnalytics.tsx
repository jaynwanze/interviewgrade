'use client';

import { InterviewAverageDetails } from '@/components/Interviews/InterviewAnalytics/InterviewAverageDetails';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Interview, InterviewAnalytics } from '@/types';
import { Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'shepherd.js/dist/css/shepherd.css';
import { InterviewGraphsDetailed } from '../../_graphs/_detailed/InterviewGraphsDetailed';

export default function InterviewAnalyticsPage({
  templateId,
}: {
  templateId: string;
}) {
  const {
    loadingDetailed,
    error,
    fetchDetailedData,
    currentSentimentDetailed,
  } = useAnalyticsData();

  const searchParams = useSearchParams();
  const { startTour } = useWalkthrough();
  const isTutorialMode = searchParams.get('1') === 'true';
  const mode = searchParams.get('mode');
  const [tourStarted, setTourStarted] = useState(false);
  const [detailed, setDetailed] = useState<InterviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const mockLatestInterview: Interview = {
    id: "mock-id",
    candidate_id: "mock-candidate-id",
    template_id: "mock-template-id",
    interview_template_id: "mock-interview-template-id",
    title: "Mock Interview Title",
    role: "Mock Role",
    skill: "Mock Skill",
    description: "Mock Description",
    mode: "practice",
    difficulty: "Easy",
    status: "completed",
    created_at: "2023-01-01T00:00:00Z",
    is_general: false,
    is_system_defined: false,
    evaluation_criterias: [],
    current_question_index: 0,
    question_count: 5,
    duration: 0,
    start_time: '',
    end_time: ''
  };

  if (!templateId)
    return (
      <div className="flex flex-col items-center">
        <p className="text-center text-gray-500">No template ID provided.</p>
        <p> Please select a template to view analytics data.</p>
      </div>
    );
  else if (!mode)
    return (
      <div className="flex flex-col items-center">
        <p className="text-center text-gray-500">No mode selected.</p>
        <p> Please select a mode to view analytics data.</p>
      </div>
    );
  else if (mode !== 'practice' && mode !== 'interview') {
    return (
      <div className="flex flex-col items-center">
        <p className="text-center text-gray-500">Invalid mode selected.</p>
        <p> Please select a valid mode to view analytics data.</p>
      </div>
    );
  }

  const selectedTemplateId = templateId;
  const selectedMode = mode === 'practice' ? 'Practice Mode' : 'Interview Mode';
  const badgeColor = mode === 'practice' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';

  useEffect(() => {
    setLoading(true);
    if (selectedTemplateId) {
      fetchDetailedData(selectedTemplateId, selectedMode).then((data) => {
        if (data) {
          setDetailed(data);
        }
      });
    }
    setLoading(false);
  }, [selectedTemplateId, selectedMode]);

  // Define tour steps specific to InterviewAnalyticsPage
  const analyticsTourSteps = [
    {
      id: 'dashboard-overview',
      title: 'Welcome to Your Analytics Dashboard',
      text: 'This is your personal interview analytics dashboard where you can track your progress and improve.',
      attachTo: { element: '.dashboard-overview', on: 'bottom' as const },
      buttons: [{ text: 'Next', action: () => this.next() }],
    },
    {
      id: 'latest-interview',
      title: 'Latest Interview Summary',
      text: 'Here you see your most recent interview summary.',
      attachTo: { element: '.latest-interview-card', on: 'top' as const },
      buttons: [
        { text: 'Back', action: () => this.back() },
        { text: 'Next', action: () => this.next() },
      ],
    },
  ];

  useEffect(() => {
    if (isTutorialMode && !tourStarted) {
      startTour(analyticsTourSteps);
      setTourStarted(true);
      //endTutorialMode();
      //replace router.push with endTutorialMode
    }
  }, [isTutorialMode, tourStarted, startTour]);


  const renderDetailed = () => {
    if (loadingDetailed || loading) {
      return (
        <div className="flex flex-col items-center">
          <LoadingSpinner />
        </div>
      );
    }
    return (
      <>
        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : detailed &&
          selectedTemplateId &&
          selectedMode
          ? (
            <>
              <div className="flex justify-center space-x-2 mb-4">
                <Badge variant="secondary" className={`text-sm md:text-base px-4 py-2 rounded-full flex items-center gap-2 ${badgeColor} shadow-sm hover:shadow-md transition-all`}>
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  {detailed?.interview_title || 'Deleted Template'}
                </Badge>
              </div>
              <div id="performance-graph">
                <InterviewAverageDetails
                  analyticsData={detailed}
                  latestInterview={mockLatestInterview!}
                />
                <InterviewGraphsDetailed
                  analyticsData={detailed}
                  sentimentAnalysis={currentSentimentDetailed || null}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <p className="mt-5 text-center text-gray-500">
                No analytics data found for this interview template.
              </p>
            </div>
          )}
      </>
    );
  };

  return (
    <div className="dashboard-overview container mx-auto p-2 w-3/4">
      <h1 className="text-2xl font-bold text-center mb-1">
        Skill Performance Overview
      </h1>
      <p className="text-center text-gray-500">
        Explore detailed analytics and insights for this {mode} mode template.
      </p>
      <Separator className="my-4" />
      {renderDetailed()}
    </div>
  );
}
