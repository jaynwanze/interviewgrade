'use client';

import CombinedTemplateCarousel from '@/components/Interviews/Dashboard/CombinedTemplateCarousel';
import TipsCard from '@/components/Interviews/Dashboard/TipsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { InterviewAnalytics } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import 'shepherd.js/dist/css/shepherd.css';

export default function InterviewAnalyticsPage() {
  const {
    loadingOverview,
    loadingDetailed,
    error,
    overview,
    fetchOverviewData,
  } = useAnalyticsData();

  const searchParams = useSearchParams();
  const { startTour } = useWalkthrough();
  const isTutorialMode = searchParams.get('1') === 'true';
  const [tourStarted, setTourStarted] = useState(false);

  const [activeSwitch, setActiveSwitch] = useState<
    'Practice Mode' | 'Interview Mode'
  >('Practice Mode');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [filteredCompletedInterviews, setFilteredCompletedInterviews] =
    useState<InterviewAnalytics[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchOverviewData(activeSwitch);
  }, []);

  // Debounce the search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Tour steps
  const analyticsTourSteps = [
    {
      id: 'dashboard-overview',
      title: 'Welcome to Your Analytics Dashboard',
      text: 'Track your progress and improve your performance here.',
      attachTo: { element: '.dashboard-overview', on: 'bottom' as const },
      buttons: [{ text: 'Next', action: () => this.next() }],
    },
    {
      id: 'latest-interview',
      title: 'Latest Interview Summary',
      text: 'View a quick snapshot of your most recent interview.',
      attachTo: { element: '.latest-interview-card', on: 'top' as const },
      buttons: [
        { text: 'Back', action: () => this.back() },
        { text: 'Next', action: () => this.next() },
      ],
    },
  ];

  // Switch handling
  const handleSwitchChange = useCallback(
    (switchMode: 'Practice Mode' | 'Interview Mode') => {
      setActiveSwitch(switchMode);
      if (overview?.interviewAnalytics) {
        let filtered = [...overview.interviewAnalytics];
        if (switchMode === 'Practice Mode') {
          filtered = filtered.filter(
            (interview) => interview.template_id !== null,
          );
        } else {
          filtered = filtered.filter(
            (interview) => interview.interview_template_id !== null,
          );
        }
        setFilteredCompletedInterviews(filtered);
      }
    },
    [overview],
  );

  useEffect(() => {
    handleSwitchChange(activeSwitch);
  }, [handleSwitchChange, activeSwitch]);

  // Start tour if in tutorial mode
  useEffect(() => {
    if (isTutorialMode && !tourStarted) {
      startTour(analyticsTourSteps);
      setTourStarted(true);
    }
  }, [isTutorialMode, tourStarted, startTour]);

  // Filter results by debounced query
  const uniqueFilteredTemplateInterviews = useMemo(() => {
    if (!filteredCompletedInterviews) return [];
    const templates: InterviewAnalytics[] = [];
    const searchLower = debouncedQuery.toLowerCase();
    filteredCompletedInterviews.forEach((interview) => {
      const titleLower = interview.interview_title.toLowerCase();
      if (titleLower.includes(searchLower)) {
        templates.push(interview);
      }
    });
    return templates;
  }, [debouncedQuery, filteredCompletedInterviews]);

  // Navigate to template details
  const handleTemplateClick = (templateId: string) => {
    const mode = activeSwitch === 'Practice Mode' ? 'practice' : 'interview';
    router.push(`/candidate/dashboard/${templateId}?mode=${mode}`);
  };

  const averageScore = useMemo(() => {
    if (!overview?.interviewAnalytics?.length) return 0;
    const scores =
      overview.interviewAnalytics.map((i) => i.avg_overall_grade || 0) || [];
    const total = scores.reduce((a, b) => a + b, 0);
    return Math.round(scores.length ? total / scores.length : 0);
  }, [overview]);

  const renderContent = () => {
    if (error) {
      return <p className="text-center text-red-600">Failed to load data.</p>;
    }

    if (loadingOverview || loadingDetailed) {
      return (
        <div className="flex flex-col items-center py-10">
          <LoadingSpinner />
          <p className="mt-2 text-gray-500">Loading your dashboard...</p>
        </div>
      );
    }

    if (!overview?.completedInterviews?.length) {
      return (
        <div className="text-center text-gray-600 my-6">
          <p>No completed sessions found. Start one to see analytics here.</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/interviews/library')}
            variant="outline"
          >
            Start Interview
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800">Current Skills Breakdown</h2>
                    <div className="flex justify-center mt-2">
                        {uniqueFilteredTemplateInterviews.length > 0 && (
                            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                <TooltipProvider>
                                    Total Grade Avg: <br></br> {averageScore}%
                                    <Tooltip>
                                        <TooltipTrigger className="cursor-pointer">
                                            <Info className="inline-block ml-1 w-4 h-4 text-gray-500" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="w-48">
                                            This is the average score across all your skills in {activeSwitch}.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                        )}
                    </div>
                </div> */}

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {uniqueFilteredTemplateInterviews.length} Skills Found
          </div>

          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={activeSwitch === 'Interview Mode'}
              onCheckedChange={() =>
                setActiveSwitch(
                  activeSwitch === 'Practice Mode'
                    ? 'Interview Mode'
                    : 'Practice Mode',
                )
              }
            />
            <Label>{activeSwitch}</Label>
          </div>
        </div>
        <CombinedTemplateCarousel
          templates={uniqueFilteredTemplateInterviews}
          onView={handleTemplateClick}
        />
        <Separator className="my-4" />
        <TipsCard />
      </div>
    );
  };

  return (
    <div className="dashboard-overview container mx-auto p-4 w-3/4">
      <div className="space-y-2 mb-4">
        <h1 className="text-2xl font-bold text-center">Candidate Dashboard</h1>
        <p className="text-center text-gray-500 mb-2 ">
          Track your progress and improve your performance with detailed skill
          insights.
        </p>
        <Separator />
      </div>
      {renderContent()}
    </div>
  );
}
