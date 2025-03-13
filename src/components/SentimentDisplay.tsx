'use client';

import { motion } from 'framer-motion';
import { Card, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

// Types
type SentimentType = 'positive' | 'neutral' | 'negative';
export type SentimentDetails = {
  icon: string;
  color: string;
};

// Base details for each sentiment type
export const SENTIMENT_DETAILS = {
  positive: { icon: '👍', color: 'bg-green-600' },
  neutral: { icon: '😐', color: 'bg-gray-400' },
  negative: { icon: '👎', color: 'bg-red-600' },
};

// Function to compute a dynamic description based on label and confidence score.
export const getDynamicDescription = (label: string, score: number) => {
  if (label === 'positive') {
    if (score < 70) return 'Positive performance, but still needs improvement.';
    else if (score < 90) return 'Very good performance!';
    else return 'Excellent work!';
  } else if (label === 'neutral') {
    if (score < 70) return 'Balanced feedback with room for growth.';
    else if (score < 90)
      return 'Consistent performance; consider areas for enhancement.';
    else return 'Solid performance overall!';
  } else if (label === 'negative') {
    if (score < 70) return 'Minor issues noted; improvements are possible.';
    else if (score < 90)
      return 'Clear areas for improvement; attention needed.';
    else return 'Significant concerns; major improvements required.';
  } else {
    return 'Sentiment analsyis not avaiable.';
  }
};

const SentimentDisplay = ({ label, score }) => {
  const sentiment = SENTIMENT_DETAILS[label] || SENTIMENT_DETAILS['neutral'];
  const dynamicDescription = getDynamicDescription(label, score);

  return (
    <>
      <Card className="p-4 h-full flex flex-col justify-center">
        <CardTitle className="text-center">
          Feedback Sentiment Analysis
        </CardTitle>
        <Separator className="my-2" />

        <div className="flex items-center space-x-3">
          <span className="text-3xl">{sentiment.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {label.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dynamicDescription}
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 w-full bg-gray-300 rounded-full">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1 }}
            className={`h-full ${sentiment.color} rounded-full`}
          />
        </div>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Confidence: <span className="font-bold">{score.toFixed(0)}%</span>
        </p>
      </Card>
    </>
  );
};

export default SentimentDisplay;
