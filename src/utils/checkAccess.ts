import { getCurrentCandidateSubscription } from '@/data/user/candidate';
import { NormalizedSubscription } from '@/types';

export type FeatureKey =
  | 'unlimited_practice'
  | 'unlimited_interviews'
  | 'detailed_feedback'
  | 'radar_chart'
  | 'rubric_breakdown'
  | 'ai_coach'
  | 'pdf_download'
  | 'custom_interviews'
  | 'sentiment_analysis'
  | 'resume_analysis'
  | 'unlimited_job_tracker'
  | 'full_history';

export type PlanLimits = {
  practiceSessionsPerMonth: number;
  mockInterviewsPerMonth: number;
  jobTrackerLimit: number;
  historyLimit: number;
  aiCoachQuestionsPerSession: number;
  rubricCriteriaShown: number;
};

export const FREE_LIMITS: PlanLimits = {
  practiceSessionsPerMonth: 3,
  mockInterviewsPerMonth: 1,
  jobTrackerLimit: 5,
  historyLimit: 5,
  aiCoachQuestionsPerSession: 0,
  rubricCriteriaShown: 1, // Show only 1 criteria free
};

export const PRO_LIMITS: PlanLimits = {
  practiceSessionsPerMonth: Infinity,
  mockInterviewsPerMonth: Infinity,
  jobTrackerLimit: Infinity,
  historyLimit: Infinity,
  aiCoachQuestionsPerSession: Infinity,
  rubricCriteriaShown: Infinity,
};

export const PRO_FEATURES_DISPLAY = [
  'Unlimited practice & mock interviews',
  'Detailed rubric breakdown & feedback',
  'Skills radar chart visualization',
  'AI Coach chat assistance',
  'PDF report downloads',
  'Resume keyword analysis',
  'Custom interview builder',
];

// Feature info for upgrade prompts
export const FEATURE_INFO: Record<FeatureKey, {
  name: string;
  description: string;
  upgradeMessage: string;
}> = {
  unlimited_practice: {
    name: 'Unlimited Practice Sessions',
    description: 'Practice as much as you want with no monthly limits',
    upgradeMessage: 'Upgrade to Pro for unlimited practice sessions',
  },
  unlimited_interviews: {
    name: 'Unlimited Mock Interviews',
    description: 'Take unlimited full mock interviews',
    upgradeMessage: 'Upgrade to Pro for unlimited mock interviews',
  },
  detailed_feedback: {
    name: 'Detailed Feedback',
    description: 'Get comprehensive feedback on every answer',
    upgradeMessage: 'Upgrade to Pro for detailed feedback',
  },
  radar_chart: {
    name: 'Skills Radar Chart',
    description: 'Visualize your strengths and weaknesses',
    upgradeMessage: 'Upgrade to Pro to see your skills radar chart',
  },
  rubric_breakdown: {
    name: 'Full Rubric Breakdown',
    description: 'See how you scored on each evaluation criteria',
    upgradeMessage: 'Upgrade to Pro to see your complete rubric breakdown',
  },
  ai_coach: {
    name: 'AI Coach',
    description: 'Chat with AI about your interview performance',
    upgradeMessage: 'Upgrade to Pro to chat with your AI interview coach',
  },
  pdf_download: {
    name: 'PDF Reports',
    description: 'Download detailed interview reports',
    upgradeMessage: 'Upgrade to Pro to download PDF reports',
  },
  custom_interviews: {
    name: 'Custom Interview Builder',
    description: 'Create custom interviews from job descriptions',
    upgradeMessage: 'Upgrade to Pro to create custom interviews',
  },
  sentiment_analysis: {
    name: 'Sentiment Analysis',
    description: 'AI analysis of your tone and confidence',
    upgradeMessage: 'Upgrade to Pro for sentiment analysis',
  },
  resume_analysis: {
    name: 'Resume Keyword Analysis',
    description: 'AI-powered resume analysis and suggestions',
    upgradeMessage: 'Upgrade to Pro for resume analysis',
  },
  unlimited_job_tracker: {
    name: 'Unlimited Job Tracking',
    description: 'Track unlimited job applications',
    upgradeMessage: 'Upgrade to Pro for unlimited job tracking',
  },
  full_history: {
    name: 'Full Interview History',
    description: 'Access your complete interview history',
    upgradeMessage: 'Upgrade to Pro for full history access',
  },
};

export const PRO_FEATURES: FeatureKey[] = [
  'unlimited_practice',
  'unlimited_interviews',
  'detailed_feedback',
  'radar_chart',
  'rubric_breakdown',
  'ai_coach',
  'pdf_download',
  'custom_interviews',
  'sentiment_analysis',
  'resume_analysis',
  'unlimited_job_tracker',
  'full_history',
];

export function isPro(subscription: NormalizedSubscription): boolean {
  return (
    subscription.type === 'active' ||
    subscription.type === 'trialing'
  );
}

export function hasFeatureAccess(
  subscription: NormalizedSubscription,
  feature: FeatureKey
): boolean {
  if (isPro(subscription)) {
    return true;
  }
  // Free users don't have access to pro features
  return !PRO_FEATURES.includes(feature);
}

export function getPlanLimits(subscription: NormalizedSubscription): PlanLimits {
  return isPro(subscription) ? PRO_LIMITS : FREE_LIMITS;
}

export function getFeatureInfo(feature: FeatureKey) {
  return FEATURE_INFO[feature];
}

// Server-side helper to check access
export async function checkFeatureAccess(feature: FeatureKey): Promise<boolean> {
  const subscription = await getCurrentCandidateSubscription();
  return hasFeatureAccess(subscription, feature);
}

export async function getSubscriptionLimits(): Promise<PlanLimits> {
  const subscription = await getCurrentCandidateSubscription();
  return getPlanLimits(subscription);
}