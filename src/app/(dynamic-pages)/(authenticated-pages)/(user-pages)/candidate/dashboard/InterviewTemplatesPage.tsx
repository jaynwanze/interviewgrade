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
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import 'shepherd.js/dist/css/shepherd.css';

export default function InterviewAnalyticsPage({ userId }: { userId: string }) {
  const { loadingOverview, error, overview, fetchOverviewData } =
    useAnalyticsData(userId);

  const searchParams = useSearchParams();
  const { startTour } = useWalkthrough();
  const isTutorialMode = searchParams.get('1') === 'true';
  const [tourStarted, setTourStarted] = useState(false);

  const [activeSwitch, setActiveSwitch] = useState<
    'Practice Mode' | 'Interview Mode'
  >('Practice Mode');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const router = useRouter();

  // Only the selected mode is loaded. The hook caches each mode after its
  // first fetch so switching back is instant for the rest of this page visit.
  useEffect(() => {
    void fetchOverviewData(activeSwitch);
  }, [activeSwitch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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

  useEffect(() => {
    if (isTutorialMode && !tourStarted) {
      startTour(analyticsTourSteps);
      setTourStarted(true);
    }
  }, [isTutorialMode, tourStarted, startTour]);

  const filteredTemplates = useMemo(() => {
    const searchLower = debouncedQuery.trim().toLowerCase();
    if (!searchLower) {
      return overview;
    }

    return overview.filter((template) =>
      template.title.toLowerCase().includes(searchLower),
    );
  }, [debouncedQuery, overview]);

  const handleTemplateClick = (templateId: string) => {
    const mode = activeSwitch === 'Practice Mode' ? 'practice' : 'interview';
    router.push(`/candidate/dashboard/${templateId}?mode=${mode}`);
  };

  const renderContent = () => {
    if (loadingOverview) {
      return (
        <div className="flex flex-col items-center py-10">
          <LoadingSpinner />
          <p className="mt-2 text-gray-500">Loading skills...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-600">Failed to load data.</p>;
    }

    if (overview.length === 0) {
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="bg-blue-100 text-blue-800 text-xs text-center font-medium px-2.5 py-0.5 rounded-full">
            {filteredTemplates.length} Skills Found
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
          templates={filteredTemplates}
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
