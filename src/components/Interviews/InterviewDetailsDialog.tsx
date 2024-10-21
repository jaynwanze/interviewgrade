'use client';

import { T } from '@/components/ui/Typography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function InterviewDetailsDialog({ isOpen, onClose }) {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/candidate/interviews/session/id`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How it Works</DialogTitle>
          <DialogDescription>
            <div>
              <T.Subtle>Questions</T.Subtle>
              <p>You can view upcoming interview questions on the sidebar to the left.</p>
            </div>
            <div>
              <T.Subtle>Get Ready</T.Subtle>
              <p>You will get 5 seconds before recording, once you receive the question.</p>
            </div>
            <div>
              <T.Subtle>Feedback</T.Subtle>
              <p>You will receive feedback on your questions after you’ve completed all the questions.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Button className="mt-4" onClick={handleClick}>
          Start Interview
        </Button>
      </DialogContent>
    </Dialog>
  );
}