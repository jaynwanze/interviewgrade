'use client';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { startInterviewAction } from '@/data/user/interviews';
import { useToastMutation } from '@/hooks/useToastMutation';
import {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function InterviewDetailsDialog({
  isOpen,
  onClose,
  selectedTemplate,
  interviewMode,
}: {
  isOpen: boolean;
  onClose: () => void; // parent controls opening/closing
  selectedTemplate: PracticeTemplate | InterviewTemplate;
  interviewMode: InterviewModeType;
}) {
  const [isStarting, setIsStarting] = useState(false);

  const router = useRouter();

  function LoadingOverlay() {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/75 backdrop-blur-sm">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          Hang tight, this may take a few seconds…
        </p>
      </div>
    );
  }

  const feedbackStringPrefix =
    interviewMode === 'practice'
      ? 'You will receive live feedback after each question and then an'
      : 'You will receive an';

  // The function that attempts to start the interview
  const { mutate: handleClick } = useToastMutation(
    async () => {
      setIsStarting(true);
      // Start the interview
      const interview = await startInterviewAction(
        selectedTemplate,
        interviewMode,
      );
      router.push(`/candidate/interviews/session/${interview.id}`);
    },
    {
      loadingMessage: 'Creating session...',
      successMessage: 'Session prepared, Bringing you now!',
      errorMessage: 'Failed to create session.',
      onSuccess: () => {
        setIsStarting(false);
        onClose();
      },
      onError: () => {
        setIsStarting(false);
      },
    },
  );

  return (
    <>
      {isStarting ? (
        <LoadingOverlay />
      ) : (

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              How it Works
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Prepare yourself for the session flow.
            </DialogDescription>
          </DialogHeader>
          <DialogDescription>
            <div className="justify-items-center text-center mb-2">
              <div className="mb-1">
                <span className="bg-gray-100 text-gray-800 text-lg font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                  Questions
                </span>
              </div>
              <p className="text-base">
                Current{' '}
                {interviewMode === 'practice' ? 'practice' : 'interview'}{' '}
                questions on the container to the left.
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
                {feedbackStringPrefix} overall report once you finish.
              </p>
            </div>
          </DialogDescription>
          <Button onClick={() => handleClick()}>Start Session</Button>
        </DialogContent>
      </Dialog>
      )}

    </>
  );
}
