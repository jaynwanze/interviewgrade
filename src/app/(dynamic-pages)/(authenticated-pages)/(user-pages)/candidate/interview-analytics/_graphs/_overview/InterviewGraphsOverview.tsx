'use client';
import { InterviewAnalytics } from '@/types';
import { motion } from 'framer-motion';
import { BarChartActive } from '../BarChartActive';
import { RadarChartGridCircleFilled } from '../RadarChartGridCircleFilled';
import { RadialChartGrid } from '../RadialChartGrid';
import { AreaChartInteractiveLarge } from './AreaChartInteractiveInterviewTotal';
import { Card } from '@/components/ui/card';

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
  analyticsData,
}: {
  analyticsData: InterviewAnalytics[];
}) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
  
      
      <motion.div variants={itemVariants}>
        <AreaChartInteractiveLarge />
      </motion.div>
      <motion.div
        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row auto-rows-max gap-6"
        variants={containerVariants}
      >
      </motion.div>
    </motion.div>
  );
}
