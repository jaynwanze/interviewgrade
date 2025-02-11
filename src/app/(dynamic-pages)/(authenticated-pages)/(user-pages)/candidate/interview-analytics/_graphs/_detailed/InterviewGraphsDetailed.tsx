'use client';
import { InterviewAnalytics } from '@/types';
import { motion } from 'framer-motion';
import { AreaChartInteractiveOverallGrades } from './AreaChartInteractiveOverallGrades';
import { BarChartInteractiveEvaluationScores } from './BarCharInteractiveEvaluationScores';
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
}: {
  analyticsData: InterviewAnalytics;
}) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-5 items-center">
        <motion.div className="sm:col-span-2" variants={itemVariants}>
          <RadialChartEvaluationsScoreAverages
            avgEvaluationCriteriaScores={
              analyticsData.avg_evaluation_criteria_scores
            }
          />
        </motion.div>
        <motion.div className="sm:col-span-2" variants={itemVariants}>
          <AreaChartInteractiveOverallGrades
            completedInterviewEvaluations={
              analyticsData.completed_interview_evaluations
            }
          />
        </motion.div>
      </div>
      <motion.div className="lg:grid-cols-2" variants={itemVariants}>
        <BarChartInteractiveEvaluationScores
          completedInterviewEvaluations={
            analyticsData.completed_interview_evaluations
          }
        />
      </motion.div>
    </motion.div>
  );
}
