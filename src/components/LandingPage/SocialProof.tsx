'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Software Engineer at Google',
    content:
      'The AI feedback helped me identify blind spots I never knew I had. Landed my dream job!',
    rating: 5,
  },
  {
    name: 'James K.',
    role: 'Product Manager at Meta',
    content:
      'Practiced 20+ interviews before my actual one. The confidence boost was incredible.',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'Data Scientist at Amazon',
    content:
      'The rubric breakdown showed me exactly where to improve. Worth every penny.',
    rating: 5,
  },
];

const stats = [
  { value: '10,000+', label: 'Candidates Prepared' },
  { value: '85%', label: 'Success Rate' },
  { value: '50,000+', label: 'Interviews Completed' },
  { value: '4.9/5', label: 'Average Rating' },
];

export default function SocialProof() {
  return (
    <section className="py-16 bg-muted/30 border-y">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="bg-background rounded-xl p-6 shadow-sm border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "{testimonial.content}"
              </p>
              <div>
                <div className="font-medium">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
