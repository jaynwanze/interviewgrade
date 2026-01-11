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
};

export const FREE_LIMITS: PlanLimits = {
  practiceSessionsPerMonth: 3,
  mockInterviewsPerMonth: 1,
  jobTrackerLimit: 5,
  historyLimit: 3,
  aiCoachQuestionsPerSession: 0,
};

export const PRO_LIMITS: PlanLimits = {
  practiceSessionsPerMonth: Infinity,
  mockInterviewsPerMonth: Infinity,
  jobTrackerLimit: Infinity,
  historyLimit: Infinity,
  aiCoachQuestionsPerSession: 10,
};

export const PRO_FEATURES_DISPLAY = [
  'Unlimited practice & mock interviews',
  'Detailed rubric breakdown & feedback',
  'AI Coach chat assistance',
  'PDF report downloads',
  'Resume keyword analysis',
  'Custom interview builder',
];


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

// Server-side helper to check access
export async function checkFeatureAccess(feature: FeatureKey): Promise<boolean> {
  const subscription = await getCurrentCandidateSubscription();
  return hasFeatureAccess(subscription, feature);
}

export async function getSubscriptionLimits(): Promise<PlanLimits> {
  const subscription = await getCurrentCandidateSubscription();
  return getPlanLimits(subscription);
}