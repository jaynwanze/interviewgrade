'use client';

import InterviewDetailsDialog from '@/components/Interviews/InterviewLibrary/InterviewDetailsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import { motion } from 'framer-motion';
import { Clock, ListOrdered } from 'lucide-react';
import { useState } from 'react';

interface ExtendedTemplate extends PracticeTemplate {
  isComingSoon?: boolean;
}

function isComingSoonTemplate(
  template: PracticeTemplate | InterviewTemplate,
): template is ExtendedTemplate & { isComingSoon: true } {
  return (template as ExtendedTemplate).isComingSoon === true;
}

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

  const isComingSoon = isComingSoonTemplate(selectedTemplate);

  if (isComingSoon) {
    return (
      <Card className="flex flex-col justify-center items-center border rounded-lg shadow-lg hover:shadow-xl transition duration-200 text-center max-w-80 h-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-purple-white to-grey-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 backdrop-blur-sm" />

        <div className="relative z-10 p-6 space-y-4">
          <motion.h2
            className="text-xl font-bold text-gray-800 dark:text-gray-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {selectedTemplate.title}
          </motion.h2>
          <motion.p
            className="text-sm text-gray-700 dark:text-gray-200 px-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {selectedTemplate.description}
          </motion.p>

          <CardContent className="flex flex-col items-center">
            <Button disabled className="opacity-70 cursor-not-allowed">
              Coming Soon
            </Button>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card
      key={selectedTemplate.id}
      className="flex flex-col justify-center items-center border rounded-lg shadow-lg hover:shadow-xl transition duration-200 text-center max-w-80 h-full"
    >
      <CardHeader className="flex flex-col items-center">
        <motion.h2
          className="text-xl font-bold text-gray-800 dark:text-gray-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {selectedTemplate.title}
        </motion.h2>
      </CardHeader>
      <CardContent className="space-y-3 text-gray-600">
        <p className="text-sm">{selectedTemplate.description}</p>
        <div className="flex justify-center items-center space-x-3 text-sm text-gray-700">
          <div className="flex items-center space-x-1">
            <ListOrdered className="w-4 h-4 text-blue-500" />
            <span>Max {selectedTemplate.question_count} Qs</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>{selectedTemplate.duration} min</span>
          </div>
        </div>
        <Button className="w-full mt-3" onClick={handleClick}>
          Start Session
        </Button>
      </CardContent>

      {isDialogOpen && (
        <InterviewDetailsDialog
          isOpen={isDialogOpen}
          onClose={handleClose}
          selectedTemplate={selectedTemplate}
          interviewMode={interviewMode}
        />
      )}
    </Card>
  );
};
