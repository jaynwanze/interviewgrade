'use client';

import { InterviewCardTemplate } from '@/components/Interviews/InterviewLibrary/InterviewTemplateCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  getInterviewTemplatesByCategory,
  getPracticeTemplatesByCategoryAndMode,
} from '@/data/user/templates';
import {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import {
  INTERVIEW_INTERVIEW_MODE,
  INTERVIEW_PRACTICE_MODE,
} from '@/utils/constants';
import { ChevronLeft } from 'lucide-react';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const displayString =
    interviewMode === INTERVIEW_PRACTICE_MODE
      ? 'Select Practice Session'
      : 'Select Mock Interview';
  const interviewModeString =
    interviewMode === 'practice' ? 'Practice Mode' : 'Mock Interview';
  // Determine badge color and icon based on mode
  const modeBadge =
    interviewMode === INTERVIEW_INTERVIEW_MODE
      ? 'bg-blue-500 text-white'
      : 'bg-green-500 text-white';

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      if (interviewMode === INTERVIEW_PRACTICE_MODE) {
        const data = await getPracticeTemplatesByCategoryAndMode(
          INTERVIEW_PRACTICE_MODE,
          'Soft Skills',
        );
        setPracticeTemplates(data);
      } else {
        const data = await getInterviewTemplatesByCategory('Soft Skills');
        setInterviewTemplates(data);
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

  // Filter templates based on search query
  let filteredTemplates: (PracticeTemplate | InterviewTemplate)[] = [];
  if (interviewMode === INTERVIEW_PRACTICE_MODE) {
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
    <div className=" mx-auto max-w-5xl">
      <div className="flex items-center justify-self-center">
        <button
          className="rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold">{displayString}</h1>
          <p className="text-gray-500 mt-2">
            Select a mock interview that aligns with your role, industry, or
            skill focus.
          </p>
        </div>
      </div>
      <Separator className="my-6" />
      <div className="flex justify-center items-center space-x-4">
        <Badge className={`bg-black text-sm ${modeBadge}`}>
          {interviewModeString}
        </Badge>
        <Input
          placeholder="Search position or company..."
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
      </div>
  );
}
