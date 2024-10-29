'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createInterview,
  createInterviewQuestions,
} from '@/data/user/interviews';
import { useToastMutation } from '@/hooks/useToastMutation';
import { InterviewTemplate } from '@/types';
import { useRouter } from 'next/navigation';

export default function InterviewDetailsDialog({
  isOpen,
  onClose,
  interviewTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  interviewTemplate: InterviewTemplate;
}) {
  const router = useRouter();
  const { mutate: handleClick } = useToastMutation(
    async () => {
      // Redirect to the interview session page
      const interview = await createInterview(interviewTemplate);
      await createInterviewQuestions(interview.id, interviewTemplate);
      router.push(`/candidate/interviews/session/id`);
    },
    {
      loadingMessage: 'Creating interview...',
      successMessage: 'Interview Prepared, Bringing you to session!',
      errorMessage: 'Failed to prepare Interview',
    },
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How it Works</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div className="flex justify-center text-align">
            <div>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Questions
              </span>
              <p>Current interview questions on the container to the left.</p>
            </div>
            <div>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Get Ready
              </span>
              <p>
                You will get 5 seconds before recording, once you receive the
                question.
              </p>
            </div>
            <div>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                Feedback
              </span>
              <p>
                You will receive feedback on your questions after you’ve
                completed all the questions.
              </p>
            </div>
          </div>
        </DialogDescription>
        <Button className="mt-4" onClick={handleClick}>
          Start Interview
        </Button>
      </DialogContent>
    </Dialog>
  );
}
