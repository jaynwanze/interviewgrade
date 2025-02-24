'use client';
import { Button } from '@/components/ui/button';
import { startInterviewAction } from '@/data/user/interviews';
import { getRandomPracticeTemplate } from '@/data/user/templates';
import { useState } from 'react';

export function TutorialPracticeStep() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTutorial = async () => {
    setIsLoading(true);
    try {
      // 1) fetch random practice template
      const randomTemplate = await getRandomPracticeTemplate();
      if (!randomTemplate) throw new Error('No random template found!');

      // 2) call server action
      const newInterview = await startInterviewAction(
        randomTemplate,
        'practice',
      );
      if (!newInterview?.id) throw new Error('Failed to start interview');

      // 3) redirect to the interview page
      //     with e.g. "?tutorial=1" so the interview page knows
      window.location.href = `/candidate/interviews/session/${newInterview.id}?tutorial=1`;
    } catch (err) {
      console.error('Tutorial start error:', err?.message || err);
      setError('Failed to start tutorial');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Quick Practice Tutorial</h2>
      <p className="text-sm">
        Let’s do a quick single-question practice to see how it works!
      </p>
      <Button onClick={handleStartTutorial} disabled={isLoading}>
        {isLoading ? 'Starting...' : 'Start Tutorial'}
      </Button>
      <Button
      className='ml-4'
        onClick={() => {
          alert('Skip action');
        }}
      >
        Skip
      </Button>
    </div>
  );
}
