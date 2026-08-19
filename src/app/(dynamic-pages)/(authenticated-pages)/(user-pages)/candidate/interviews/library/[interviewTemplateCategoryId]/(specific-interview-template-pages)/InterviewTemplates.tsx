'use client';

import { InterviewCardTemplate } from '@/components/Interviews/InterviewLibrary/InterviewTemplateCard';
import { CreateCustomInterviewDialog } from '@/components/Interviews/CreateCustomInterviewDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProBadge, UpgradePrompt } from '@/components/ProFeatureGateDialog';
import { UsageDisplay } from '@/components/UsageDisplay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { canStartSession } from '@/data/user/candidate';
import {
  getInterviewTemplatesByCategory,
  getPracticeTemplatesByCategoryAndMode,
} from '@/data/user/templates';
import { canStartV2AwarePracticeSessionAction } from '@/modules/session/session-usage.actions';
import {
  COMING_SOON_MOCK_TEMPLATES,
  COMING_SOON_TEMPLATES,
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import {
  INTERVIEW_INTERVIEW_MODE,
  INTERVIEW_PRACTICE_MODE,
} from '@/utils/constants';
import { ChevronLeft, Lock, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function InterviewTemplates({
  interviewMode,
}: {
  interviewMode: string;
}) {
  const [practiceTemplates, setPracticeTemplates] = useState<
    PracticeTemplate[]
  >([]);
  const [interviewTemplates, setInterviewTemplates] = useState<
    InterviewTemplate[]
  >([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showCustomInterviewDialog, setShowCustomInterviewDialog] =
    useState(false);
  const [sessionAccess, setSessionAccess] = useState<{
    allowed: boolean;
    remaining: number;
    limit: number;
    isPro: boolean;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isPracticeMode = interviewMode === INTERVIEW_PRACTICE_MODE;
  const displayString = isPracticeMode
    ? 'Select Practice Session'
    : 'Select Mock Interview';
  const interviewModeString = isPracticeMode
    ? 'Practice Mode'
    : 'Mock Interview';
  const modeBadge =
    interviewMode === INTERVIEW_INTERVIEW_MODE
      ? 'bg-blue-500 text-white'
      : 'bg-green-500 text-white';

  const handleCreateCustomInterviewClick = () => {
    if (!sessionAccess?.isPro) {
      setShowUpgradePrompt(true);
    }
  };

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      if (isPracticeMode) {
        const data = await getPracticeTemplatesByCategoryAndMode(
          INTERVIEW_PRACTICE_MODE,
          'Soft Skills',
        );
        const combined = [...data, ...COMING_SOON_TEMPLATES];
        setPracticeTemplates(combined);
      } else {
        const data = await getInterviewTemplatesByCategory('Soft Skills');
        const combined = [...data, ...COMING_SOON_MOCK_TEMPLATES];
        setInterviewTemplates(combined);
      }
    } catch (error) {
      console.error('Error fetching interview templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [interviewMode]);

  useEffect(() => {
    const checkAccess = async () => {
      const access = isPracticeMode
        ? await canStartV2AwarePracticeSessionAction()
        : await canStartSession('interview');
      setSessionAccess(access);
    };
    checkAccess();
  }, [interviewMode, isPracticeMode]);

  let filteredTemplates: (PracticeTemplate | InterviewTemplate)[] = [];
  if (isPracticeMode) {
    filteredTemplates = practiceTemplates.filter((template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  } else {
    filteredTemplates = interviewTemplates.filter((template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  if (isLoading || !filteredTemplates) {
    return (
      <div className="flex justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-row justify-normal items-center mb-4">
        <button
          className="justify-start rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex flex-col justify-center mx-auto items-center">
          <h1 className="text-2xl font-bold">{displayString}</h1>
          <p className="text-gray-500 mt-2">
            {isPracticeMode
              ? 'Choose a built-in practice template, or create a new v2 Practice.'
              : 'Select a mock interview that aligns with your role, industry, or skill focus.'}
          </p>
        </div>
      </div>

      {sessionAccess && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <UsageDisplay
              label={isPracticeMode ? 'Practice Sessions' : 'Mock Interviews'}
              used={sessionAccess.limit - sessionAccess.remaining}
              limit={sessionAccess.limit}
              isPro={sessionAccess.isPro}
            />

            {isPracticeMode ? (
              <Button asChild>
                <Link href="/candidate/practices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Practice
                </Link>
              </Button>
            ) : sessionAccess.isPro ? (
              <CreateCustomInterviewDialog
                open={showCustomInterviewDialog}
                onOpenChange={setShowCustomInterviewDialog}
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Custom Interview
                  </Button>
                }
              />
            ) : (
              <Button
                onClick={handleCreateCustomInterviewClick}
                variant="outline"
              >
                <Lock className="mr-2 h-4 w-4" />
                Custom Interview
                <ProBadge className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}

      <Separator className="my-6" />
      <div className="flex justify-center items-center space-x-4">
        <Badge className={`bg-black text-sm ${modeBadge}`}>
          {interviewModeString}
        </Badge>
        <Input
          placeholder="Search templates..."
          className="max-w-lg shadow-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Separator className="my-6" />
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center items-center">
          {filteredTemplates.map((template) => (
            <InterviewCardTemplate
              key={template.id}
              selectedTemplate={template}
              interviewMode={interviewMode as InterviewModeType}
              access={sessionAccess!}
            />
          ))}
        </div>
      ) : (
        <div className="w-full max-w-lg border rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xl font-semibold">No interviews found</h3>
          <p className="text-gray-600 mt-2">
            No results for this search. Please check back later.
          </p>
        </div>
      )}

      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        feature="Custom Interview Builder"
        description="Paste any job description and get a tailored mock interview with role-specific questions. Your resume will be analyzed to create personalized questions."
      />
    </div>
  );
}
