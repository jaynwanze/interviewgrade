'use client';

import { InterviewAverageDetails } from '@/components/Interviews/InterviewAnalytics/InterviewAverageDetails';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { cn } from '@/lib/utils';
import { Interview, InterviewAnalytics } from '@/types';
import {
  INTERVIEW_INTERVIEW_MODE,
  INTERVIEW_PRACTICE_MODE,
} from '@/utils/constants';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { InterviewGraphsDetailed } from './_graphs/_detailed/InterviewGraphsDetailed';

export type TemplateAndSwitchModeDetails = {
  current_template_id: string;
  current_switch_mode: string;
};

export default function InterviewAnalyticsPage() {
  const {
    loadingOverview,
    loadingDetailed,
    error,
    overview,
    fetchDetailedData,
    currentSentimentDetailed,
  } = useAnalyticsData();

  const searchParams = useSearchParams();
  const isTutorialMode = true;
  const [tourStarted, setTourStarted] = useState(false);

  const [detailed, setDetailed] = useState<InterviewAnalytics | null>(null);
  const [activeSwitch, setActiveSwitch] = useState<
    'Practice Mode' | 'Interview Mode'
  >('Practice Mode');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [practiceModeValue, setPracticeModeValue] = useState('');
  const [interviewModeValue, setInterviewModeValue] = useState('');

  const [selectedPractceModeTemplateId, setPracticeModeSelectedTemplateId] =
    useState<string | null>(null);
  const [selectedInterviewModeTemplateId, setInterviewModeSelectedTemplateId] =
    useState<string | null>(null);
  const [filteredCompletedInterviews, setFilteredCompletedInterviews] =
    useState<Interview[]>([]);

  const selectedTemplateId =
    activeSwitch === 'Practice Mode'
      ? selectedPractceModeTemplateId
      : selectedInterviewModeTemplateId;
  const setSelectedTemplateId =
    activeSwitch === 'Practice Mode'
      ? setPracticeModeSelectedTemplateId
      : setInterviewModeSelectedTemplateId;

  const value =
    activeSwitch === 'Practice Mode' ? practiceModeValue : interviewModeValue;
  const setValue =
    activeSwitch === 'Practice Mode'
      ? setPracticeModeValue
      : setInterviewModeValue;

  // Debounce the search query to optimize performance
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const uniqueFilteredTemplateInterviews = useMemo(() => {
    if (!filteredCompletedInterviews) return [];

    const uniqueTitles = new Set<string>();
    const filteredTemplates: Interview[] = [];

    const searchLower = debouncedQuery.toLowerCase();

    filteredCompletedInterviews.forEach((interview) => {
      const titleLower = interview.title.toLowerCase();
      if (titleLower.includes(searchLower) && !uniqueTitles.has(titleLower)) {
        uniqueTitles.add(titleLower);
        filteredTemplates.push(interview);
      }
    });

    return filteredTemplates;
  }, [debouncedQuery, filteredCompletedInterviews]);

  const handleSwitchChange = useCallback(
    (switchMode: 'Practice Mode' | 'Interview Mode') => {
      setActiveSwitch(switchMode);
      let filtered = [...(overview?.completedInterviews || [])];

      if (switchMode === 'Practice Mode') {
        filtered = filtered.filter(
          (interview) => interview.mode === INTERVIEW_PRACTICE_MODE,
        );
      } else if (switchMode === 'Interview Mode') {
        filtered = filtered.filter(
          (interview) => interview.mode === INTERVIEW_INTERVIEW_MODE,
        );
      }

      setFilteredCompletedInterviews(filtered);
    },
    [overview],
  );

  const getCurrentTemplateIdOnInit = (
    latestInterview: Interview,
  ): TemplateAndSwitchModeDetails => {
    let currentTemplateId: string = '';
    let currentSwitchMode: string = '';
    if (latestInterview.template_id) {
      currentTemplateId = latestInterview.template_id;
      currentSwitchMode = 'Practice Mode';
      setActiveSwitch('Practice Mode');
    } else {
      currentTemplateId = latestInterview.interview_template_id;
      currentSwitchMode = 'Interview Mode';
      setActiveSwitch('Interview Mode');
    }
    return {
      current_template_id: currentTemplateId,
      current_switch_mode: currentSwitchMode,
    };
  };

  useEffect(() => {
    handleSwitchChange(activeSwitch);
  }, [handleSwitchChange, activeSwitch]);

  useEffect(() => {
    if (overview?.latestInterview && !selectedTemplateId) {
      const currentTemplateAndSwitchDetails: TemplateAndSwitchModeDetails =
        getCurrentTemplateIdOnInit(overview.latestInterview);
      fetchDetailedData(
        currentTemplateAndSwitchDetails.current_template_id,
        currentTemplateAndSwitchDetails.current_switch_mode,
      ).then((data) => {
        if (data && overview?.latestInterview) {
          setDetailed(data);
          setValue(overview.latestInterview.title);
          setSelectedTemplateId(
            currentTemplateAndSwitchDetails.current_template_id,
          );
        }
        return;
      });
    }
  }, [overview]);

  useEffect(() => {
    if (isTutorialMode && !tourStarted) {
      startTutorialTour();
      setTourStarted(true);
      //endTutorialMode();
      //replace router.push with endTutorialMode
    }
  }, [isTutorialMode]);

  const startTutorialTour = () => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-md bg-white rounded-lg p-4 text-sm',
        scrollTo: true,
        cancelIcon: { enabled: true },
      },
    });

    tour.addStep({
      id: 'dashboard-overview',
      title: 'Welcome to Your Analytics Dashboard',
      text: 'This is your personal interview analytics dashboard where you can track your progress and improve.',
      attachTo: { element: '', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
      id: 'latest-interview',
      title: 'Latest Interview Summary',
      text: 'This section provides a quick summary of your most recent interview, including your score and feedback.',
      attachTo: { element: '.latest-interview-card', on: 'top' },
      buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next },
      ],
    });

    tour.addStep({
      id: 'performance-graph',
      title: 'Performance Trends',
      text: 'This graph shows how your interview performance has changed over time.',
      attachTo: { element: '.performance-graph', on: 'right' },
      buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Next', action: tour.next },
      ],
    });

    tour.addStep({
      id: 'insights-section',
      title: 'Your Strengths & Weaknesses',
      text: 'This section provides insights into your best-performing skills and areas that need improvement.',
      attachTo: { element: '.insights-section', on: 'left' },
      buttons: [
        { text: 'Back', action: tour.back },
        { text: 'Finish', action: tour.complete },
      ],
    });

    tour.start();
  };

  const renderDetailed = () => {
    if (loadingDetailed) {
      return (
        <div className="flex flex-col items-center">
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <>
        {/* <InterviewAnalyticsGrid analyticsData={detailed} /> */}
        <div className="flex justify-center items-center space-x-2 mb-4 relative">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                className="w-[600px] justify-between"
              >
                {value ? value : 'Select Template...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0 z-40 mt-2">
              <Command>
                <CommandInput placeholder="Search Template..." />
                <CommandList className="w-full h-full">
                  <CommandEmpty>No template found.</CommandEmpty>
                  <CommandGroup>
                    {uniqueFilteredTemplateInterviews &&
                      uniqueFilteredTemplateInterviews?.map((interview) => (
                        <CommandItem
                          key={interview.id}
                          value={interview.title}
                          onSelect={(currentValue) => {
                            const selectedValue =
                              currentValue === value.toLowerCase()
                                ? ''
                                : interview.title;
                            setValue(selectedValue);
                            if (selectedValue) {
                              const currentTemplateId = interview.template_id
                                ? interview.template_id
                                : interview.interview_template_id;
                              setSelectedTemplateId(currentTemplateId);
                              fetchDetailedData(
                                currentTemplateId,
                                activeSwitch,
                              ).then((data) => {
                                if (data) {
                                  setDetailed(data);
                                }
                                return;
                              });
                            } else {
                              setSelectedTemplateId(null);
                              setDetailed(null);
                            }
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value === interview.title
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {interview.title}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Switch
            id="analytics-history-mode"
            checked={activeSwitch === 'Interview Mode'}
            onCheckedChange={() =>
              handleSwitchChange(
                activeSwitch === 'Practice Mode'
                  ? 'Interview Mode'
                  : 'Practice Mode',
              )
            }
          />
          <Label htmlFor="analytics-history-mode">
            {activeSwitch === 'Interview Mode'
              ? 'Interview Mode'
              : 'Practice Mode'}
          </Label>
        </div>
        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : detailed &&
          selectedTemplateId &&
          filteredCompletedInterviews.length > 0 ? (
          <div className="performance-graph">
            <InterviewAverageDetails
              analyticsData={detailed}
              latestInterview={overview.latestInterview!}
              sentimentAnalysis={currentSentimentDetailed || null}
            />
            <InterviewGraphsDetailed
              analyticsData={detailed}
              sentimentAnalysis={currentSentimentDetailed || null}
            />
          </div>
        ) : !detailed && selectedTemplateId && activeSwitch ? (
          <p className="mt-5 text-center text-gray-500">
            No analytics data found for this interview template.
          </p>
        ) : activeSwitch && filteredCompletedInterviews.length === 0 ? (
          <p className="mt-5 text-center text-gray-500">
            No completed interviews found for this filter.
          </p>
        ) : (
          <p className="mt-5 text-center text-gray-500">
            Select an interview template to view detailed analytics.
          </p>
        )}
      </>
    );
  };

  return (
    <div className="dashboard-overview container mx-auto p-2 w-3/4">
      <h1 className="text-2xl font-bold text-center mb-1">
        Interview Analytics Dashboard
      </h1>
      <p className="text-center text-gray-500">
        View and analyze your interview performance.
      </p>
      <Separator className="my-4" />
      {renderDetailed()}
    </div>
  );
}
