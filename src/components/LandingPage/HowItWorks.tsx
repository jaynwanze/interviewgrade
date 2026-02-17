'use client';

import { motion } from 'framer-motion';
import { Upload, MessageSquare, BarChart3, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Choose Your Interview',
    description:
      'Select from 50+ interview templates covering soft skills, technical questions, and role-specific scenarios.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MessageSquare,
    title: 'Practice with AI',
    description:
      'Answer questions naturally while our AI evaluates your response in real-time. No judgment, just helpful feedback.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Get Detailed Feedback',
    description:
      'Receive comprehensive rubric-based scoring with specific suggestions on how to improve each answer.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Trophy,
    title: 'Land Your Dream Job',
    description:
      'Track your progress over time, build confidence, and walk into your interview ready to impress.',
    color: 'from-green-500 to-emerald-500',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24" id="how-it-works">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            From nervous candidate to confident professional in 4 simple steps
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-muted-foreground/20 to-transparent" />
              )}

              <div className="text-center">
                <div
                  className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} p-0.5 mb-6`}
                >
                  <div className="w-full h-full bg-background rounded-2xl flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-foreground" />
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
