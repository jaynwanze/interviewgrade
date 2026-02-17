'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    description: 'Perfect for trying out the platform',
    features: [
      '3 practice sessions/month',
      '1 mock interview/month',
      'Basic feedback & scoring',
      'Interview history (last 5)',
      'Job tracker (5 entries)',
    ],
    notIncluded: [
      'Detailed rubric breakdown',
      'AI Coach chat',
      'PDF downloads',
      'Custom interview builder',
    ],
    cta: 'Get Started Free',
    href: '/c/signup',
    popular: false,
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '€9.99',
    period: 'month',
    description: 'Everything you need to land your dream job',
    features: [
      'Unlimited practice sessions',
      'Unlimited mock interviews',
      'Detailed rubric breakdown',
      'AI Coach chat assistance',
      'PDF report downloads',
      'Resume keyword analysis',
      'Custom interview builder',
      'Full interview history',
      'Unlimited job tracking',
      'Priority support',
    ],
    notIncluded: [],
    cta: 'Start 7-Day Free Trial',
    href: '/c/signup?plan=pro',
    popular: true,
    icon: Crown,
  },
];

export default function Pricing() {
  return (
    <section className="py-24" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Pricing
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Start free, upgrade when you're ready. Cancel anytime.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-yellow-400'
                  : 'bg-background border'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${plan.popular ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-muted'}`}
                >
                  <plan.icon
                    className={`h-5 w-5 ${plan.popular ? 'text-white' : ''}`}
                  />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>

              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>

              <p className="text-muted-foreground mb-6">{plan.description}</p>

              <Link href={plan.href}>
                <Button
                  className={`w-full mb-6 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <span className="h-4 w-4 flex items-center justify-center mt-0.5 flex-shrink-0">
                      —
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Money back guarantee */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground">
            💳 No credit card required for free plan • 7-day free trial on Pro •
            Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
