'use client';
import { Interview } from '@/types';
import { motion } from 'framer-motion';
import { AreaChartInteractiveInterviewTotal } from './AreaChartInteractiveInterviewTotal';

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

export function InterviewGraphsOverview({
  interviewsCompleted,
}: {
  interviewsCompleted: Interview[];
}) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <AreaChartInteractiveInterviewTotal
          interviewsCompleted={interviewsCompleted}
        />
      </motion.div>
    </motion.div>
  );
}
