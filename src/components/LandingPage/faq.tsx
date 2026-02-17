'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does the AI evaluation work?',
    answer:
      'Our AI uses advanced language models to analyze your responses for content accuracy, communication clarity, structure, and relevance to the question. It compares your answer against rubric-based criteria and provides specific, actionable feedback.',
  },
  {
    question: 'What types of interviews can I practice?',
    answer:
      'We offer 50+ interview templates covering soft skills (communication, teamwork, problem-solving), behavioral questions, technical interviews, and role-specific scenarios for positions like Product Manager, Software Engineer, and more.',
  },
  {
    question: 'Is my interview data private?',
    answer:
      'Absolutely. Your interview recordings and responses are encrypted and never shared with third parties. We only use your data to provide you with personalized feedback and track your progress.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      "Yes! You can cancel your Pro subscription at any time with no questions asked. You'll continue to have access until the end of your billing period.",
  },
  {
    question: 'What happens after my free sessions run out?',
    answer:
      "Once you've used your 3 free practice sessions and 1 mock interview for the month, you can upgrade to Pro for unlimited access, or wait until the next month when your free credits reset.",
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "We offer a 7-day free trial on Pro so you can try all features before committing. If you're not satisfied within the first 7 days of your paid subscription, contact us for a full refund.",
  },
];

export default function FAQ() {
  return (
    <section className="py-24 bg-muted/30" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Everything you need to know about InterviewGrade
          </motion.p>
        </div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background rounded-lg border px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
