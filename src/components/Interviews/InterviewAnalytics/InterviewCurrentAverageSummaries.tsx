'use client';

import { HighlightedItem } from '@/components/HighlightedItem';
import { SummaryList } from '@/components/SummaryList';

export const InterviewCurrentAverageSummaries = ({
  strengths,
  areasForImprovement,
  recommendations,
}: {
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}) => {
  return (
    <div className="space-y-4">
      {/* Strengths */}
      <div>
        <h4 className="text-sm text-gray-500 dark:text-gray-300 text-center mb-2">
          Evaluation Criteria Feedback Summaries
        </h4>
        <HighlightedItem items={strengths} label="Strengths" />
      </div>

      {/* Areas for Improvement */}
      <div>
        <HighlightedItem
          items={areasForImprovement}
          label="Areas for Improvement"
        />
      </div>

      {/* Recommendations */}
      <div>
        <HighlightedItem items={recommendations} label="Recommendations" />
      </div>
    </div>
  );
};
