'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Info, Sparkles } from 'lucide-react';

export type SentimentDetails = {
  icon: string;
  color: string;
};

export const SENTIMENT_DETAILS = {
  positive: {
    icon: '👍',
    color: 'bg-gradient-to-r from-green-500 to-green-700',
    title: 'Positive',
  },
  neutral: {
    icon: '😐',
    color: 'bg-gradient-to-r from-gray-400 to-gray-600',
    title: 'Neutral',
  },
  negative: {
    icon: '👎',
    color: 'bg-gradient-to-r from-red-500 to-red-700',
    title: 'Negative',
  },
};

export const getDynamicDescription = (label: string, score: number): string => {
  if (label === 'positive') {
    if (score < 70)
      return "There's a positive tone, but the candidate might convey more conviction.";
    else if (score < 90)
      return 'A confident and engaging answer, reflecting strong positivity.';
    else
      return 'Exceptionally upbeat and enthusiastic, leaving a great impression.';
  } else if (label === 'neutral') {
    if (score < 70)
      return 'A balanced but somewhat restrained tone; more distinct insights could help.';
    else if (score < 90)
      return 'Calm and even-keeled, indicating a reflective approach.';
    else
      return 'Highly composed and consistent, showcasing thoughtful insights.';
  } else if (label === 'negative') {
    if (score < 70)
      return 'Some negative hints; the response could be more assertive or optimistic.';
    else if (score < 90)
      return 'Noticeable hesitancy and self-doubt in the candidate’s tone.';
    else
      return 'Strongly negative signals, suggesting significant uncertainty or pessimism.';
  }
  return 'Sentiment analysis not available.';
};

export const getCommunicationStyleBadge = (label: string, score: number) => {
  // Return a short descriptor + icon or badge color
  if (label === 'positive') {
    if (score < 70)
      return {
        text: 'Optimistic Speaker',
        color: 'bg-green-200 text-green-800',
      };
    else if (score < 90)
      return {
        text: 'Confident Communicator',
        color: 'bg-green-300 text-green-900',
      };
    else
      return {
        text: 'Charismatic Dynamo',
        color: 'bg-green-400 text-green-900',
      };
  } else if (label === 'neutral') {
    if (score < 70)
      return { text: 'Steady Speaker', color: 'bg-gray-200 text-gray-800' };
    else if (score < 90)
      return { text: 'Balanced Talker', color: 'bg-gray-300 text-gray-900' };
    else return { text: 'Even-Tempered', color: 'bg-gray-400 text-gray-900' };
  } else {
    if (score < 70)
      return { text: 'Cautious Speaker', color: 'bg-red-200 text-red-800' };
    else if (score < 90)
      return {
        text: 'Reserved Communicator',
        color: 'bg-red-300 text-red-900',
      };
    else return { text: 'Hesitant Talker', color: 'bg-red-400 text-red-900' };
  }
};

const SentimentDisplay = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => {
  const sentiment = SENTIMENT_DETAILS[label] || SENTIMENT_DETAILS['neutral'];
  const styleBadge = getCommunicationStyleBadge(label, score);

  return (
    <Card className="p-4 flex flex-col justify-center h-full transform transition hover:scale-105 relative overflow-hidden shadow-lg rounded-lg p-6">
      {/* Optional Decorative Background */}
      <CardTitle className="flex flex-col items-center p-2 z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-yellow-500 w-5 h-5" />
          <span>Communication Style</span>
        </div>
      </CardTitle>
      <Separator className="my-1 z-10" />
      <CardContent className="z-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Overall Tone: {sentiment.title}
              </h3>
              <div className="relative w-full h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden my-2">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1.5 }}
                  className={`h-full ${sentiment.color} rounded-full`}
                />
              </div>
              <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                Confidence:{' '}
                <span className="font-bold">{score.toFixed(0)}%</span>
              </p>
            </div>
          </div>
          {/* Style Badge */}
          {/* Style Badge + Tooltip */}
          {/* <span className="flex items-center justify-center gap-1"> */}
            <div
              className={`inline-flex justify-center px-3 py-1 rounded-full font-medium ${styleBadge?.color || 'bg-gray-200 text-gray-900'}`}
            >
              {styleBadge?.text || 'N/A'}
            </div>

            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-600 dark:text-gray-200 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Sentiment analysis provides an{' '}
                    <strong>exploratory glimpse</strong> of the candidate’s
                    communication style. It uses <strong>one data point</strong>{' '}
                    (overall answers) for a high-level overview.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}
          {/* </span> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentDisplay;
