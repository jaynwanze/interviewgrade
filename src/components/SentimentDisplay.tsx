'use client';

import { motion } from 'framer-motion';

const SENTIMENT_DETAILS: Record<
  string,
  { icon: string; description: string; color: string }
> = {
  admiration: { icon: '🌟', description: 'Great performance!', color: 'bg-blue-500' },
  approval: { icon: '👍', description: 'Positive affirmation!', color: 'bg-green-600' },
  optimism: { icon: '🌈', description: 'Hopeful and positive!', color: 'bg-blue-300' },
  pride: { icon: '🏆', description: 'A sense of accomplishment.', color: 'bg-orange-400' },
  gratitude: { icon: '🙏', description: 'Thankful response.', color: 'bg-yellow-600' },
  realization: { icon: '💡', description: 'A moment of clarity.', color: 'bg-blue-600' },

  // Moderate sentiment (neutral but slightly leaning)
  curiosity: { icon: '🔍', description: 'Showing interest.', color: 'bg-blue-400' },
  confusion: { icon: '🤔', description: 'Needs further clarity.', color: 'bg-gray-500' },

  // Negative sentiment
  annoyance: { icon: '😤', description: 'Mild dissatisfaction.', color: 'bg-orange-500' },
  disappointment: { icon: '😞', description: 'Did not meet expectations.', color: 'bg-gray-600' },
  sadness: { icon: '😢', description: 'Feeling down.', color: 'bg-gray-700' },

  // Default fallback (neutral sentiment)
  neutral: { icon: '😐', description: 'Balanced feedback.', color: 'bg-gray-400' },
};

const SentimentDisplay = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => {
  const sentiment = SENTIMENT_DETAILS[label] || SENTIMENT_DETAILS['neutral']; // Default to neutral if unknown

  return (
    <div className="w-full max-w-md p-4 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center space-x-3">
        <span className="text-3xl">{sentiment.icon}</span>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {label.toUpperCase()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sentiment.description}
          </p>
        </div>
      </div>

      {/* Animated Progress Bar */}
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
    </div>
  );
};

export default SentimentDisplay;
