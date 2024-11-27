'use client';
import { InterviewAnalytics } from '@/types';
import { motion } from 'framer-motion';
import { AreaChartInteractiveOverallScore } from './AreaChartInteractiveOverallScore';
import { BarChartInteractiveEvaluationScores } from './BarCharInteractiveEvaluationScores';

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
      <motion.div variants={itemVariants}>
        <AreaChartInteractiveOverallScore
          templateId={analyticsData.template_id}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <BarChartInteractiveEvaluationScores
          templateId={analyticsData.template_id}
        />
      </motion.div>
    </motion.div>
  );
}
