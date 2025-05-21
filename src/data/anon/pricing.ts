// InterviewGrade ‑ candidate‑side pricing data
// -------------------------------------------------
// Three public tiers: Free, Basic, Pro
// Monthly prices are chosen to hit the psychological €9.99 / €19.99 anchors.
// Annual = 2 months free (×10).

export type Pricing = {
  title: string;
  price: string; // monthly price in EUR
  annualPrice: string; // annual price in EUR
  features: string[];
  description: string;
  isHighlighted?: boolean;
};

export const pricing: Pricing[] = [
  {
    title: 'Free',
    price: '0',
    annualPrice: '0',
    description: 'Test‑drive InterviewGrade with core features',
    features: [
      '2 mock‑interview sessions per month',
      'Overall score + Quick tips',
      // 'Local transcript download',
      'AI coach chat (1 question per session)',
    ],
  },
  {
    title: 'Pro',
    price: '9.99',
    annualPrice: '99',
    description: 'Level‑up feedback & unlimited practice',
    features: [
      'Everything in Free',
      'Unlimited mock & practice sessions',
      'Full rubric breakdown & sentiment graph',
      'Skill‑progress dashboard & radar chart',
      'AI coach chat (10 questions per session)',
      // 'Resume keyword gap analysis',
      'Downloadable PDF reports',
    ],
    isHighlighted: true,
  },
  // {
  //   title: 'Pro',
  //   price: '19.99',
  //   annualPrice: '199',
  //   description: 'Deep personalisation & career branding',
  //   features: [
  //     'Everything in Basic',
  //     'Custom interview templates from job description',
  //     'Unlimited AI‑coach follow‑ups',
  //     'Voice‑clone feedback playback',
  //     'Shareable public profile & portfolio',
  //     'Priority email support',
  //   ],
  // },
];
