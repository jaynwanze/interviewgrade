'use client';

import { InterviewLatestCard } from '@/components/Interviews/InterviewAnalytics/InterviewLatestCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { cn } from '@/lib/utils';
import { Interview, InterviewAnalytics } from '@/types';
import {
  INTERVIEW_INTERVIEW_MODE,
  INTERVIEW_PRACTICE_MODE,
} from '@/utils/constants';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InterviewGraphsDetailed } from './_graphs/_detailed/InterviewGraphsDetailed';
import { InterviewGraphsOverview } from './_graphs/_overview/InterviewGraphsOverview';

export default function InterviewAnalyticsPage() {
  const {
    loadingOverview,
    loadingDetailed,
    error,
    overview,
    fetchDetailedData,
  } = useAnalyticsData();

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

  useEffect(() => {
    handleSwitchChange(activeSwitch);
  }, [handleSwitchChange, activeSwitch]);

  useEffect(() => {
    if (overview?.latestInterview && !selectedTemplateId) {
      fetchDetailedData(overview.latestInterview.template_id).then((data) => {
        if (data && overview?.latestInterview) {
          setDetailed(data);
          setValue(overview.latestInterview.title);
          setSelectedTemplateId(overview.latestInterview.template_id);
        }
        return;
      });
    }
  }, [overview]);

  const renderOverview = () => {
    if (loadingOverview) {
      return (
        <div className="flex flex-col items-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    return (
      <>
        <InterviewLatestCard latestInterview={overview?.latestInterview} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">
          <Card>
            <CardHeader>
              <CardTitle>Practice Sessions Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">
                {overview?.completedInterviews?.filter(
                  (interview) => interview.mode === INTERVIEW_PRACTICE_MODE,
                ).length || 0}
              </p>
              <p>Total completed practice sessions.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Interview Sessions Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-center">
                {overview?.completedInterviews?.filter(
                  (interview) => interview.mode === INTERVIEW_INTERVIEW_MODE,
                ).length || 0}
              </p>
              <p>Total completed interview sessions.</p>
            </CardContent>
          </Card>
        </div>
        <InterviewGraphsOverview
          interviewsCompleted={overview?.completedInterviews || []}
        />
      </>
    );
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
                <CommandList className="w-full H-full">
                  <CommandEmpty>No template found.</CommandEmpty>
                  <CommandGroup>
                    {uniqueFilteredTemplateInterviews &&
                      uniqueFilteredTemplateInterviews?.map((interiew) => (
                        <CommandItem
                          key={interiew.id}
                          value={interiew.title}
                          onSelect={(currentValue) => {
                            const selectedValue =
                              currentValue === value.toLowerCase()
                                ? ''
                                : interiew.title;
                            setValue(selectedValue);
                            if (selectedValue) {
                              setSelectedTemplateId(interiew.template_id);
                              fetchDetailedData(interiew.template_id).then(
                                (data) => {
                                  if (data) {
                                    setDetailed(data);
                                  }
                                  return;
                                },
                              );
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
                              value === interiew.title
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {interiew.title}
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
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Current Averages</CardTitle>
              </CardHeader>
              <CardContent>
                <p>TO DO.</p>
              </CardContent>
            </Card>
            <InterviewGraphsDetailed analyticsData={detailed} />
          </>
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
    <div className="container mx-auto p-6">
      <Card className="mb-6 text-center">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Interview Analytics Dashboard
          </CardTitle>
        </CardHeader>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-2 w-full mx-auto mb-5">
          <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>
        <TabsContent value="details">{renderDetailed()}</TabsContent>
      </Tabs>
    </div>
  );
}
