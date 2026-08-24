export type Pricing = {
  title: string;
  price: string;
  features: string[];
  description: string;
  isHighlighted?: boolean;
};

export const pricing: Pricing[] = [
  {
    title: 'Free',
    price: '0',
    description: 'Start practising and see the full InterviewGrade workflow.',
    features: [
      '3 AI Practice runs per month',
      '3 AI-created Practices per month',
      'Unlimited manual Practice creation and editing',
      'Rubric-based answer feedback and final reports',
    ],
  },
  {
    title: 'Pro',
    price: '9.99',
    description: 'More monthly capacity for consistent interview practice.',
    features: [
      '30 AI Practice runs per month',
      '30 AI-created Practices per month',
      'Unlimited manual Practice creation and editing',
      'Rubric-based answer feedback and final reports',
      'Shared Practice participation uses the creator allowance',
    ],
    isHighlighted: true,
  },
];
