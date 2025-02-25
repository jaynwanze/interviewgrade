'use client';

import InterviewDetailsDialog from '@/components/Interviews/InterviewLibrary/InterviewDetailsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import { Clock, ListOrdered } from 'lucide-react';
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

  const handleClick = () => setIsDialogOpen(true);
  const handleClose = () => setIsDialogOpen(false);

  // Determine badge color based on difficulty level
  const difficultyBadge =
    selectedTemplate.difficulty === 'Easy'
      ? 'bg-green-500 text-white'
      : selectedTemplate.difficulty === 'Medium'
        ? 'bg-yellow-500 text-white'
        : 'bg-red-500 text-white';

  return (
    <>
      <Card
        key={selectedTemplate.id}
        className="flex flex-col justify-center items-center border rounded-lg shadow-lg hover:shadow-xl transition duration-200 text-center max-w-80 h-full"
      >
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-lg font-semibold">
            {selectedTemplate.title}
          </CardTitle>
          {/* <Badge className={`mt-2 px-3 py-1 text-sm ${difficultyBadge}`}>
            {selectedTemplate.difficulty}
          </Badge> */}
        </CardHeader>

        <CardContent className="space-y-3 text-gray-600">
          <p className="text-sm">{selectedTemplate.description}</p>

          <div className="flex justify-center items-center space-x-3 text-sm text-gray-700">
            <div className="flex items-center space-x-1">
              <ListOrdered className="w-4 h-4 text-blue-500" />
              <span>Max {selectedTemplate.question_count} Questions</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span>{selectedTemplate.duration} min</span>
            </div>
            {/* <div className="flex items-center space-x-1">
              <BarChart3 className="w-4 h-4 text-gray-700" />
              <span>
                Mode: {interviewMode === 'practice' ? 'Practice' : 'Interview'}
              </span>
            </div> */}
          </div>

          <Button className="w-full mt-3" onClick={handleClick}>
            Start Session
          </Button>
        </CardContent>
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
