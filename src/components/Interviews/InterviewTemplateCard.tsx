'use client';

import { useState } from 'react';
import InterviewDetailsDialog from '@/components/Interviews/InterviewDetailsDialog'; // Corrected import
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { InterviewTemplate } from '@/types';
import { Button } from '../ui/button';

export const InterviewCardTemplate = (interview: InterviewTemplate) => {
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
        key={interview.id}
        className="border rounded-lg p-4 shadow-sm text-center"
      >
        <CardTitle className="text-xl font-semibold">{interview.title}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {interview.description}
        </CardDescription>
        <p className="text-sm mt-2">Difficulty: {interview.difficulty}</p>
        <p className="text-sm">Questions: {interview.questions_count}</p>
        <p className="text-sm">Duration: {interview.duration} min</p>
        <Button className="mt-4" onClick={handleClick}>
          Start Interview
        </Button>
      </Card>
      {isDialogOpen && (
        <InterviewDetailsDialog isOpen={isDialogOpen} onClose={handleClose} />
      )}
    </>
  );
};