'use client';
import { Card, CardTitle } from '@/components/ui/card';
import { InterviewAnalytics } from '@/types';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
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
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 mb-5 items-center">
        {/* Total Sessions Count */}
        <Card className="flex flex-col md:col-span-1 justify-center items-center h-full shadow-lg rounded-lg text-center p-6">
          <ClipboardList className="w-10 h-10 text-blue-500" />
          <CardTitle className="mt-2">Total Completed Sessions</CardTitle>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {analyticsData.total_interviews || 0}
            </p>
            <p className="text-gray-500">Total completed interview sessions.</p>
          </div>
        </Card>

        <motion.div
          className="md:col-span-1 lg:col-span-2"
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

      <motion.div className="" variants={itemVariants}>
        <BarChartInteractiveEvaluationScores
          completedInterviewEvaluations={
            analyticsData.completed_interview_evaluations
          }
        />
      </motion.div>
    </motion.div>
  );
}
