'use client';

import { Badge } from '@/components/ui/badge';
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
import { useRefreshTokens } from '@/hooks/useTokens';
import {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
} from '@/types';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const refreshTokens = useRefreshTokens();

  const feedbackStringPrefix =
    interviewMode === 'practice'
      ? 'You will receive live feedback after each question and then an'
      : 'You will receive an';

  const tokensRequired = interviewMode === 'practice' ? 1 : 3;

  // The function that attempts to start the interview
  const { mutate: handleClick } = useToastMutation(
    async () => {
      // Start the interview
      const interview = await startInterviewAction(
        selectedTemplate,
        interviewMode,
      );
      refreshTokens(); // Refresh token data
      router.push(`/candidate/interviews/session/${interview.id}`);
    },
    {
      loadingMessage: 'Creating session...',
      successMessage: 'Session prepared, Bringing you now!',
      errorMessage: 'Failed to create session.',
    },
  );

  return (
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
              Current {interviewMode === 'practice' ? 'practice' : 'interview'}{' '}
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
              {feedbackStringPrefix} overall report on your session after you’ve
              completed all the questions.
            </p>
          </div>

          <div className="justify-items-center text-center mt-4">
            <p className="text-base text-lg">
              <strong>Note:</strong> This session will use{' '}
              <Badge color="yellow" className="inline-block">
                <strong>{tokensRequired}</strong>
              </Badge>{' '}
              token{tokensRequired > 1 ? 's' : ''}
            </p>
          </div>
        </DialogDescription>
        <Button onClick={() => handleClick()}>Start Session</Button>
      </DialogContent>
    </Dialog>
  );
}
