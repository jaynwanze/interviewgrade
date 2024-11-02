'use client';

import { InterviewCardTemplate } from '@/components/Interviews/InterviewLibrary/InterviewTemplateCard';
import { Input } from '@/components/ui/input';
import { getInterviewsTemplatesByCategory } from '@/data/user/templates';
import { InterviewTemplate } from '@/types';
import { InterviewTemplateCategories } from '@/types/interviewTemplateCategories';
import { useEffect, useState } from 'react';

export function InterviewTemplates({
  interviewTemplateCategoryId,
}: {
  interviewTemplateCategoryId: string;
}) {
  const [interviewTemplates, setInterviewTemplates] = useState<
    InterviewTemplate[]
  >([]);

  useEffect(() => {
    const categoryName: string =
      InterviewTemplateCategories.find(
        (category) => category.id === interviewTemplateCategoryId,
      )?.name || '';

    const fetchInterviews = async () => {
      const interviewTemplates: InterviewTemplate[] =
        await getInterviewsTemplatesByCategory(categoryName);
      setInterviewTemplates(interviewTemplates);
    };

    fetchInterviews();
  }, [interviewTemplateCategoryId]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Select Interview</h1>

      {/* Filters Section */}
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search position or company"
          className="flex-grow mr-4"
        />
      </div>

      {/* Interview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviewTemplates.map((interview) => (
          <InterviewCardTemplate key={interview.id} {...interview} />
        ))}
      </div>
    </div>
  );
}
