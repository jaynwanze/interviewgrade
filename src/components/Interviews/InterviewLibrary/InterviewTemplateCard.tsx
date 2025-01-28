'use client';

import InterviewDetailsDialog from '@/components/Interviews/InterviewLibrary/InterviewDetailsDialog'; // Corrected import
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import { useState } from 'react';
import { Button } from '../../ui/button';

export const InterviewCardTemplate = ({
  selectedTemplate,
  interviewMode,
}: {
  selectedTemplate: PracticeTemplate | InterviewTemplate;
  interviewMode: InterviewModeType;
}) => {
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
        key={selectedTemplate.id}
        className="border rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-900 transition duration-200 shadow-sm text-center max-w-96"
      >
        <CardTitle className="text-xl font-semibold">
          {selectedTemplate.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {selectedTemplate.description}
        </CardDescription>
        <p className="text-sm mt-2">
          Difficulty: {selectedTemplate.difficulty}
        </p>
        <p className="text-sm">Questions: {selectedTemplate.question_count}</p>
        <p className="text-sm">Duration: {selectedTemplate.duration} min</p>
        <Button className="mt-4" onClick={handleClick}>
          Start Interview
        </Button>
      </Card>
      {isDialogOpen && (
        <InterviewDetailsDialog
          isOpen={isDialogOpen}
          onClose={handleClose}
          selectedTemplate={selectedTemplate}
          interviewMode={interviewMode}
        />
      )}
    </>
  );
};
