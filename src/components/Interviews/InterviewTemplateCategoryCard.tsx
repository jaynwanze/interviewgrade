'use client';

import React from 'react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { InterviewTemplateCategoriesType } from '@/types/interviewTemplateCategories';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export const InterviewCategoryCard = (
  interviewCategory: InterviewTemplateCategoriesType,
) => {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/candidate/interviews/${interviewCategory.id}`);
  };

  return (
    <Card
      key={interviewCategory.id}
      className="border rounded-lg p-4 shadow-sm text-center"
    >
      <CardTitle className="text-xl font-semibold">
        {interviewCategory.name}
      </CardTitle>
      <CardDescription className="text-sm text-gray-600">
        Description
      </CardDescription>
      <p className="text-sm mt-2">Position 1</p>
      <p className="text-sm">Position 2</p>
      <p className="text-sm">Position 3</p>
      <Button className="mt-4" onClick={handleClick}>
        View Interviews
      </Button>
    </Card>
  );
};
