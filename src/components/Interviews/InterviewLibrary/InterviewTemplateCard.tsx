'use client';

import InterviewDetailsDialog from '@/components/Interviews/InterviewLibrary/InterviewDetailsDialog'; // Corrected import
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { InterviewTemplate } from '@/types';
import { useState } from 'react';
import { Button } from '../../ui/button';

export const InterviewCardTemplate = (interviewTemplate: InterviewTemplate) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = () => {
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card
        key={interviewTemplate.id}
        className="border rounded-lg p-4 shadow-sm text-center "
      >
        <CardTitle className="text-xl font-semibold">
          {interviewTemplate.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {interviewTemplate.description}
        </CardDescription>
        <p className="text-sm mt-2">
          Difficulty: {interviewTemplate.difficulty}
        </p>
        <p className="text-sm">Questions: {interviewTemplate.question_count}</p>
        <p className="text-sm">Duration: {interviewTemplate.duration} min</p>
        <Button className="mt-4" onClick={handleClick}>
          Start Interview
        </Button>
      </Card>
      {isDialogOpen && (
        <InterviewDetailsDialog
          isOpen={isDialogOpen}
          onClose={handleClose}
          interviewTemplate={interviewTemplate}
        />
      )}
    </>
  );
};
