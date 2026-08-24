import { BarChart3, FileText, Mic2, Sparkles } from 'lucide-react';

export const featuresData = [
  {
    icon: Sparkles,
    name: 'Create focused Practices',
    description:
      'Generate a Practice with AI, upload source material, or build one manually with your own questions and rubric.',
    detail: 'AI generation · PDF/TXT upload · manual editor',
  },
  {
    icon: Mic2,
    name: 'Practice naturally with Avery',
    description:
      'Work through spoken questions with clear timing, recording controls, retries, and a focused interview experience.',
    detail: 'Voice answers · transcription · question-by-question flow',
  },
  {
    icon: BarChart3,
    name: 'Get rubric-based feedback',
    description:
      'See structured criterion feedback after each answer, then review a weighted final report when the session is complete.',
    detail: 'Criterion scores · strengths · improvement areas',
  },
  {
    icon: FileText,
    name: 'Review progress and results',
    description:
      'Return to completed Practices, open past reports, and review creator results for shared Practice sessions.',
    detail: 'History · final reports · creator results',
  },
] as const;
