'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { startInterviewAction } from '@/data/user/interviews';
import { getRandomPracticeTemplate } from '@/data/user/templates';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@radix-ui/react-icons';

export function TutorialPracticeStep() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // Track tutorial steps
  const router = useRouter();

  const handleStartTutorial = async () => {
    setIsLoading(true);
    try {
      const randomTemplate = await getRandomPracticeTemplate();
      if (!randomTemplate) throw new Error('No random template found!');

      const newInterview = await startInterviewAction(
        randomTemplate,
        'practice',
      );
      if (!newInterview?.id) throw new Error('Failed to start interview');

      router.push(
        `/candidate/interviews/session/${newInterview.id}?tutorial=1`,
      );
    } catch (err) {
      console.error('Tutorial start error:', err?.message || err);
      setError('Failed to start tutorial');
    } finally {
      setIsLoading(false);
    }
  };

  const tutorialSteps = [
    {
      title: 'Welcome to AI Mock Interviews!',
      description:
        'Our AI-driven platform helps you practice real-world job interviews with AI-driven feedback.',
    },
    {
      title: 'How It Works',
      description:
        'You will be asked interview questions just like in a real interview. The AI will analyze your response.',
    },
    {
      title: 'Receive Instant Feedback',
      description:
        'After answering, AI will provide real-time feedback, scoring your response based on different criteria.',
    },
    {
      title: 'Let’s Get Started!',
      description:
        'Ready to begin? Click "Start Tutorial" to try a quick practice session!',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Start Practice Tutorial</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {tutorialSteps[step].title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          {tutorialSteps[step].description}
        </p>

        <DialogFooter className="flex justify-between mt-4">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((prev) => prev - 1)}>
              Back
            </Button>
          )}
          {step < tutorialSteps.length - 1 ? (
            <Button onClick={() => setStep((prev) => prev + 1)}>
              Next <ArrowRightIcon className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleStartTutorial} disabled={isLoading}>
              {isLoading ? 'Starting...' : 'Start Tutorial'}
            </Button>
          )}
        </DialogFooter>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
