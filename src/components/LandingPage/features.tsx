'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  Brain,
  BarChart3,
  MessageCircle,
  FileText,
  Target,
  Zap,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'Voice-Based Practice',
    description:
      'Speak your answers naturally, just like in a real interview. Our AI listens and evaluates in real-time.',
    badge: null,
  },
  {
    icon: Brain,
    title: 'AI-Powered Evaluation',
    description:
      'Advanced language models analyze your responses for content, structure, and delivery.',
    badge: 'Core Feature',
  },
  {
    icon: BarChart3,
    title: 'Detailed Rubric Breakdown',
    description:
      'See exactly how you scored on each criteria with specific, actionable feedback.',
    badge: 'Pro',
  },
  {
    icon: MessageCircle,
    title: 'AI Coach Chat',
    description:
      'Ask follow-up questions about your performance and get personalized improvement tips.',
    badge: 'Pro',
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    description:
      'Download comprehensive interview reports to track your progress over time.',
    badge: 'Pro',
  },
  {
    icon: Target,
    title: 'Custom Interview Builder',
    description:
      'Paste any job description and get a tailored mock interview with relevant questions.',
    badge: 'Coming Soon',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description:
      'Get feedback immediately after each answer, not at the end of the interview.',
    badge: null,
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Your interview data is encrypted and never shared. Practice with complete confidence.',
    badge: null,
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-muted/30" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Everything You Need to Succeed
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Powerful tools designed to give you an unfair advantage in your next
            interview
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-background rounded-xl p-6 border hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-muted rounded-lg">
                  <feature.icon className="h-6 w-6" />
                </div>
                {feature.badge && (
                  <Badge
                    variant={feature.badge === 'Pro' ? 'default' : 'secondary'}
                    className={
                      feature.badge === 'Pro'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : ''
                    }
                  >
                    {feature.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
