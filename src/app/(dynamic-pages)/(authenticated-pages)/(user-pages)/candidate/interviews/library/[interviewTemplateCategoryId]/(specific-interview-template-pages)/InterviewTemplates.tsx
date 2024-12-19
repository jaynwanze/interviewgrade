'use client';

import { InterviewCardTemplate } from '@/components/Interviews/InterviewLibrary/InterviewTemplateCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { getInterviewsTemplatesBySkill } from '@/data/user/templates';
import { InterviewModeType, InterviewTemplate } from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import { useEffect, useState } from 'react';

export function InterviewTemplates({
  interviewTemplateCategoryId,
}: {
  interviewTemplateCategoryId: string;
}) {
  const [interviewTemplates, setInterviewTemplates] = useState<
    InterviewTemplate[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const displayString =
    interviewTemplateCategoryId === INTERVIEW_PRACTICE_MODE
      ? 'Practice Mode'
      : 'Interview Mode';

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      let interviewTemplates: InterviewTemplate[] = [];

      if (interviewTemplateCategoryId === INTERVIEW_PRACTICE_MODE) {
        interviewTemplates = await getInterviewsTemplatesBySkill();
      } else {
        // Fetch templates based on category ID
        // Example: await getInterviewsTemplatesByCategory(interviewTemplateCategoryId);
        // For now, setting to empty array
        interviewTemplates = [];
      }

      setInterviewTemplates(interviewTemplates);
    } catch (error) {
      console.error('Error fetching interview templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [interviewTemplateCategoryId]);

  // Filter templates based on search query
  const filteredTemplates = interviewTemplates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">
        {displayString}
      </h1>
      <h1 className="text-3xl font-bold mb-6 text-center">Select Interview</h1>
      <div className="flex justify-center mb-4">
        <Input
          placeholder="Search position or company"
          className="max-w-screen-2xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex justify-center min-h-screen">
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((interview) => (
              <InterviewCardTemplate
                key={interview.id}
                interviewTemplate={interview}
                interviewMode={interviewTemplateCategoryId as InterviewModeType}
              />
            ))}
          </div>
        ) : (
          <h1 className="text-lg font-bold text-center">
            No interviews Found.
          </h1>
        )}
      </div>
    </div>
  );
}
