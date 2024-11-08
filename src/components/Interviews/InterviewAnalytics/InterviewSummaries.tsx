'use client';

import { HighlightedItem } from '@/components/HighlightedItem';
import { SummaryList } from '@/components/SummaryList';

export const InterviewSummaries = ({
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
