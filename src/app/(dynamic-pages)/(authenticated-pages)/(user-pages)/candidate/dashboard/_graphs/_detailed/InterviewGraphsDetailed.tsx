'use client';
import { SentimentScore } from '@/components/Interviews/InterviewHistory/InterviewHistoryDetails';
import SentimentDisplay from '@/components/SentimentDisplay';
import { InterviewAnalytics } from '@/types';
import { motion } from 'framer-motion';
import { AreaChartInteractiveOverallGrades } from './AreaChartInteractiveOverallGrades';
import { RadialChartEvaluationsScoreAverages } from './RadialChartEvaluationsScoreAverages';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export function InterviewGraphsDetailed({
  analyticsData,
  sentimentAnalysis,
}: {
  analyticsData: InterviewAnalytics;
  sentimentAnalysis: SentimentScore | null;
}) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div
        className={`grid md:grid-cols-1 lg:grid-cols-3 gap-6 mb-5 items-center`}
      >
        {/* Sentiment Analysis */}
        {sentimentAnalysis && (
          <SentimentDisplay
            label={sentimentAnalysis.label}
            score={sentimentAnalysis.score}
          />
        )}

        <motion.div
          className={`md:col-span-3 lg:col-span-${sentimentAnalysis ? 2 : 3}`}
          variants={itemVariants}
        >
          <RadialChartEvaluationsScoreAverages
            avgEvaluationCriteriaScores={
              analyticsData.avg_evaluation_criteria_scores
            }
          />
        </motion.div>
      </div>
      <motion.div className="" variants={itemVariants}>
        <AreaChartInteractiveOverallGrades
          completedInterviewEvaluations={
            analyticsData.completed_interview_evaluations
          }
        />
      </motion.div>

      {/* <motion.div className="" variants={itemVariants}>
        <BarChartInteractiveEvaluationScores
          completedInterviewEvaluations={
            analyticsData.completed_interview_evaluations
          }
        />
      </motion.div> */}
    </motion.div>
  );
}
