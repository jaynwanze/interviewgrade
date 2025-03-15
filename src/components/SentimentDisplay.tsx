'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

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
      return "There's a positive vibe, though the candidate could show more conviction.";
    else if (score < 90)
      return 'A confident and engaging answer, demonstrating strong positivity.';
    else
      return 'An exceptionally positive and enthusiastic response, leaving a great impression.';
  } else if (label === 'neutral') {
    if (score < 70)
      return 'A measured tone with balanced insights, though it may lack distinctiveness.';
    else if (score < 90)
      return 'A calm and reflective response that remains consistently even-keeled.';
    else
      return 'A remarkably balanced answer, showcasing thoughtful and composed insights.';
  } else if (label === 'negative') {
    if (score < 70)
      return 'Minor negative signals are evident; the response could be more assertive.';
    else if (score < 90)
      return 'The answer reveals clear hesitancy and self-doubt in the candidate’s tone.';
    else
      return 'A strongly negative response, indicating significant uncertainty and pessimism.';
  } else {
    return 'Sentiment analysis not available.';
  }
};

export const getCommunicationStyle = (label: string, score: number): string => {
  if (label === 'positive') {
    if (score < 70) return 'Optimistic, but could express more conviction';
    else if (score < 90) return 'Confident and engaging communicator';
    else return 'Highly dynamic and persuasive communicator';
  } else if (label === 'neutral') {
    if (score < 70) return 'Measured and thoughtful, though somewhat reserved';
    else if (score < 90) return 'Balanced and clear in communication';
    else return 'Consistently composed and articulate';
  } else if (label === 'negative') {
    if (score < 70) return 'Slightly hesitant with a subdued tone';
    else if (score < 90) return 'Clear signs of uncertainty and self-doubt';
    else return 'Markedly hesitant and reserved in expression';
  }
  return '';
};

const SentimentDisplay = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => {
  const sentiment = SENTIMENT_DETAILS[label] || SENTIMENT_DETAILS['neutral'];
  const dynamicDescription = getDynamicDescription(label, score);
  const communicationStyle = getCommunicationStyle(label, score);

  return (
    <Card className="p-4 flex flex-col justify-center h-full transform transition hover:scale-105">
      <CardTitle className="flex flex-col items-center p-2">
        Personality Insights
      </CardTitle>
      <Separator className="my-1" />
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-4">
            {/* Optionally, you can uncomment the icon if desired */}
            {/* <span className="text-6xl">{sentiment.icon}</span> */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Overall Tone: {sentiment.title}
              </h3>
              <div className="relative w-full h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
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
              {/* <p className="text-sm text-gray-600 dark:text-gray-300">
                {dynamicDescription}
              </p> */}
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Communication Style Insight:{' '}
                <span className="font-bold">{communicationStyle}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentDisplay;
