'use client';

import { InterviewCardTemplate } from '@/components/Interviews/InterviewLibrary/InterviewTemplateCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getInterviewTemplatesByCategory,
  getPracticeTemplatesByCategoryAndMode,
} from '@/data/user/templates';
import {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
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
      ? 'Practice Mode : Select Practice Session'
      : 'Interview Mode : Select Mock Interview';

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
    <div>
      <Card className="mb-6 text-center">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            {displayString}
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="flex justify-center mb-6">
        <Input
          placeholder="Search position or company"
          className="max-w-screen-2xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex justify-center">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <InterviewCardTemplate
                key={template.id}
                selectedTemplate={template}
                interviewMode={interviewMode as InterviewModeType}
              />
            ))}
          </div>
        ) : (
          <div className="w-full max-w-96 border rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-900 transition duration-200">
            <h3 className="text-xl font-semibold">No interviews found</h3>
            <div>No interviews found for this search.</div>
            <div className="text-gray-600">Please check back later.</div>
          </div>
        )}
      </div>
    </div>
  );
}
