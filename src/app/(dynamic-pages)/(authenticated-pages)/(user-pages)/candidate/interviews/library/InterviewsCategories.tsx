'use client';

import { InterviewCategoryCard } from '@/components/Interviews/InterviewTemplateCategoryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InterviewTemplateFilter } from '@/types';
import { InterviewTemplateCategories } from '@/types/interviewTemplateCategories';

const categories: InterviewTemplateFilter[] = [
  'Category',
  'Company',
  'General',
];

export default function InterviewTemplates() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Select Interview</h1>

      {/* Filters Section */}
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search position or company"
          className="flex-grow mr-4"
        />
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button key={category} variant="secondary">
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Interview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {InterviewTemplateCategories.map((interviewTemplateCategory) => (
          <InterviewCategoryCard
            key={interviewTemplateCategory.id}
            {...interviewTemplateCategory}
          />
        ))}
      </div>
    </div>
  );
}
