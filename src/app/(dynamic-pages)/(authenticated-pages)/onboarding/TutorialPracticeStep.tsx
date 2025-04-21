'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { startInterviewAction } from '@/data/user/interviews';
import {
  getPracticeTemplatesByCategoryAndMode,
  getRandomPracticeTemplate,
} from '@/data/user/templates';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TemplatePicker } from '@/components/PracticeTemplatePicker';
import { PracticeTemplate } from '@/types';
import { INTERVIEW_PRACTICE_MODE } from '@/utils/constants';
import Lottie from 'lottie-react';
import animGo from 'public/assets/animations/AnimationGo.json';
import animInterview from 'public/assets/animations/AnimationInterview.json';
import animReport from 'public/assets/animations/AnimationReport.json';
import animWelcome from 'public/assets/animations/AnimationWelcome.json';

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

export function TutorialPracticeStep() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PracticeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    getPracticeTemplatesByCategoryAndMode(
      INTERVIEW_PRACTICE_MODE,
      'Soft Skills',
    ).then((list) => {
      setTemplates(list);
      setLoading(false);
    });
  }, []);

  const tutorial = [
    {
      title: 'Welcome to AI Mock Interviews!',
      desc: 'Our AI-driven platform helps you practice real-world job interviews with AI-driven feedback.',
      anim: animWelcome,
    },
    {
      title: 'How It Works',
      desc: 'You will be asked interview questions just like in a real interview. The AI will analyze your response.',
      anim: animInterview,
    },
    {
      title: 'Receive Instant Feedback',
      desc: 'After answering, AI will provide real-time feedback, scoring your response based on different criteria.',
      anim: animReport,
    },
    {
      title: 'Let’s Get Started!',
      desc: 'Ready to begin? Click "Start Tutorial" to try a quick practice session!',
      anim: animGo,
    },
  ];

  // Control Lottie animation based solely on isSpeaking.
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, [tutorial[step].anim]);

  /* keyboard navigation */
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && step < tutorial.length - 1)
        setStep((s) => s + 1);
      if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
    },
    [step, tutorial.length],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  /* start practice session */
  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const tmpl = await getRandomPracticeTemplate();
      if (!tmpl) throw new Error('No template returned');

      const intv = await startInterviewAction(tmpl, 'practice');
      if (!intv?.id) throw new Error('Failed to start interview');

      router.push(`/candidate/interviews/session/${intv.id}?tutorial=1`);
    } catch (err) {
      setError(err?.message ?? 'Failed to start tutorial');
      setIsStarting(false);
    }
  };
  /* Kickoff helpers */
  const startWithTemplate = async (tpl: PracticeTemplate) => {
    setIsStarting(true);
    try {
      const intv = await startInterviewAction(tpl, 'practice');
      router.push(`/candidate/interviews/session/${intv.id}?tutorial=1`);
    } catch (e) {
      setError(e.message || 'Failed to start tutorial');
      setIsStarting(false);
    }
  };
  const startRandom = async () => {
    setIsStarting(true);
    try {
      const tpl = await getRandomPracticeTemplate();
      await startWithTemplate(tpl);
    } catch (e) {
      setError(e.message || 'Failed to start tutorial');
      setIsStarting(false);
    }
  };

  /* slide animation variants */
  const slide = {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Start practice tutorial</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* progress bar */}
        <div
          className="h-1 bg-primary transition-all"
          style={{ width: `${((step + 1) / tutorial.length) * 100}%` }}
        />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>{tutorial[step].title}</DialogTitle>
          </DialogHeader>

          {/* animated body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slide}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* 2) Render Lottie with imported JSON */}
              <div className="flex justify-center">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={tutorial[step].anim}
                  loop
                  autoplay
                  style={{}}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {tutorial[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="text-sm text-destructive mt-4 text-center">{error}</p>
          )}

          <DialogFooter className="mt-6 flex justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeftIcon className="mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < tutorial.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRightIcon className="ml-1" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPicking(true)}
                  disabled={isStarting}
                >
                  Choose topic…
                </Button>
                <Button onClick={startRandom} disabled={isStarting}>
                  {isStarting ? 'Starting…' : 'Surprise me!'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </div>

        {/* Loading overlay */}
        {isStarting && <LoadingOverlay />}

        {picking && (
          <TemplatePicker
            onSelect={(tpl) => {
              setPicking(false);
              startWithTemplate(tpl);
            }}
            onCancel={() => setPicking(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
