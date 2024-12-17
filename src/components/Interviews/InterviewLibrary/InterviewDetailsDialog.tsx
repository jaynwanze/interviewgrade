'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createInterview } from '@/data/user/interviews';
import { useToastMutation } from '@/hooks/useToastMutation';
import { InterviewModeType, InterviewTemplate } from '@/types';
import { useRouter } from 'next/navigation';

export default function InterviewDetailsDialog({
  isOpen,
  onClose,
  interviewTemplate,
  interviewMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  interviewTemplate: InterviewTemplate;
  interviewMode: InterviewModeType;
}) {
  const router = useRouter();
  const { mutate: handleClick } = useToastMutation(
    async () => {
      try {
        // Create an interview session
        const interview = await createInterview(
          interviewTemplate,
          interviewMode,
        );
        router.push(`/candidate/interviews/session/${interview.id}`);
      } catch (error) {
        console.error('Error creating interview:', error);
      }
    },
    {
      loadingMessage: 'Creating interview...',
      successMessage: 'Interview prepared, Bringing you to session!',
      errorMessage: 'Failed to prepare interview',
    },
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="justify-items-center text-center">
            <DialogTitle className="text-2xl">How it Works</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription>
          <div className="justify-items-center text-center mb-2">
            <div className="mb-1">
              <span className="bg-gray-100 text-gray-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Questions
              </span>
            </div>
            <p className="text-base">
              Current interview questions on the container to the left.
            </p>
          </div>
          <div className="justify-items-center text-center mb-2">
            <div className="mb-1">
              <span className="bg-gray-100 text-gray-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Get Ready
              </span>
            </div>
            <p className="text-base">
              You will get 5 seconds before recording, once you receive the
              question.
            </p>
          </div>
          <div className="justify-items-center text-center mb-1">
            <div className="mb-1">
              <span className="bg-gray-100 text-gray-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Feedback
              </span>
            </div>
            <p className="text-base">
              You will receive feedback on your questions after you’ve completed
              all the questions.
            </p>
          </div>
        </DialogDescription>
        <Button onClick={() => handleClick()}>Start Interview</Button>
      </DialogContent>
    </Dialog>
  );
}
