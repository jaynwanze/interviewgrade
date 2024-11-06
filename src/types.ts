import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './lib/database.types';

export type AppSupabaseClient = SupabaseClient<Database>;
export type Table<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TableInsertPayload<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TableUpdatePayload<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type View<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type DBFunction<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns'];

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type Enum<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export interface SupabaseFileUploadOptions {
  /**
   * The number of seconds the asset is cached in the browser and in the Supabase CDN. This is set in the `Cache-Control: max-age=<seconds>` header. Defaults to 3600 seconds.
   */
  cacheControl?: string;
  /**
   * the `Content-Type` header value. Should be specified if using a `fileBody` that is neither `Blob` nor `File` nor `FormData`, otherwise will default to `text/plain;charset=UTF-8`.
   */
  contentType?: string;
  /**
   * When upsert is set to true, the file is overwritten if it exists. When set to false, an error is thrown if the object already exists. Defaults to false.
   */
  upsert?: boolean;
}

export type QuestionAnswerFeedback = {
  question: string;
  answer: string;
  percent: number;
  feedback: string;
};

export type EvaluationScores = {
  id: string;
  name: string;
  score: number;
  feedback: string;
};
// types.ts

export type InterviewUpdate = Pick<
  Table<'interviews'>,
  'id' | 'status' | 'current_question_index'
>;
export type InterviewComplete = Pick<
  Table<'interviews'>,
  'id' | 'end_time' | 'status' | 'current_question_index'
>;

export type EvaluationCriteriaType = Table<'evaluation_criteria'>;
export type InterviewTemplate = Table<'templates'>;
export type Questions = Table<'questions'>;
export type Interview = Table<'interviews'>;
export type InterviewQuestion = Table<'interview_questions'>;
export type InterviewTemplateCategory = {
  category: Database['public']['Enums']['template_category'];
};
export type InterviewAnalytics = Table<'interview_analytics'>;
export type AvgEvaluationScores = {
  [key: string]: number; // Allows for dynamic evaluation criteria
};
export type InterviewTemplateFilter = 'Category' | 'Company' | 'General';

export type InterviewEvaluation = Table<'interview_evaluations'>;
export type FeedbackData = {
  id: string;
  interview_id: string;
  overall_score: number;
  evaluation_scores: EvaluationScores[];
  strengths: string;
  areas_for_improvement: string;
  recommendations: string;
  question_answer_feedback: QuestionAnswerFeedback[];
};
/** One of the providers supported by GoTrue. */
export type AuthProvider =
  | 'apple'
  | 'azure'
  | 'bitbucket'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'gitlab'
  | 'google'
  | 'keycloak'
  | 'linkedin'
  | 'notion'
  | 'slack'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'workos';

export type DropzoneFile = File & {
  path: string;
};

export type DropzoneFileWithDuration = DropzoneFile & {
  duration: number;
};

export type NoSubscription = {
  type: 'no-subscription';
};

export type TrialSubscription = {
  type: 'trialing';
  trialStart: string;
  trialEnd: string;
  product: Table<'products'>;
  price: Table<'subscriptions'>;
  subscription: Table<'subscriptions'>;
};

export type ActiveSubscription = {
  type: 'active';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type PastDueSubscription = {
  type: 'past_due';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type CanceledSubscription = {
  type: 'canceled';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type PausedSubscription = {
  type: 'paused';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type IncompleteSubscription = {
  type: 'incomplete';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type IncompleteExpiredSubscription = {
  type: 'incomplete_expired';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type UnpaidSubscription = {
  type: 'unpaid';
  product: Table<'products'>;
  price: Table<'prices'>;
  subscription: Table<'subscriptions'>;
};

export type NormalizedSubscription =
  | NoSubscription
  | TrialSubscription
  | ActiveSubscription
  | PastDueSubscription
  | CanceledSubscription
  | PausedSubscription
  | IncompleteSubscription
  | IncompleteExpiredSubscription
  | UnpaidSubscription;

export type SAPayload<TData = undefined> =
  | SASuccessPayload<TData>
  | SAErrorPayload;

export type SASuccessPayload<TData = undefined> = {
  status: 'success';
} & (TData extends undefined ? { data?: TData } : { data: TData });

export type SAErrorPayload = {
  status: 'error';
  message: string;
};

import { v4 as uuidv4 } from 'uuid';

export const mockInterviewAnalytics: InterviewAnalytics[] = [
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 88.5,
    avg_evaluation_scores: [
      { communication: 90 },
      { technical_skills: 85 },
      { problem_solving: 88 },
      { punctuality: 92 },
      { teamwork: 87 },
    ],
    total_interviews: 10,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 75.2,
    avg_evaluation_scores: [
      { communication: 78 },
      { technical_skills: 72 },
      { problem_solving: 74 },
      { punctuality: 80 },
      { teamwork: 76 },
    ],
    total_interviews: 8,
    created_at: '2024-02-20T14:45:00Z',
    updated_at: '2024-02-20T14:45:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 92.3,
    avg_evaluation_scores: [
      { communication: 95 },
      { technical_skills: 90 },
      { problem_solving: 93 },
      { punctuality: 94 },
      { teamwork: 91 },
    ],
    total_interviews: 12,
    created_at: '2024-03-10T09:15:00Z',
    updated_at: '2024-03-10T09:15:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 68.4,
    avg_evaluation_scores: [
      { communication: 70 },
      { technical_skills: 65 },
      { problem_solving: 68 },
      { punctuality: 72 },
      { teamwork: 66 },
    ],
    total_interviews: 5,
    created_at: '2024-04-05T11:00:00Z',
    updated_at: '2024-04-05T11:00:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 81.7,
    avg_evaluation_scores: [
      { communication: 83 },
      { technical_skills: 80 },
      { problem_solving: 82 },
      { punctuality: 85 },
      { teamwork: 79 },
    ],
    total_interviews: 9,
    created_at: '2024-05-18T16:20:00Z',
    updated_at: '2024-05-18T16:20:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 77.9,
    avg_evaluation_scores: [
      { communication: 80 },
      { technical_skills: 75 },
      { problem_solving: 78 },
      { punctuality: 79 },
      { teamwork: 76 },
    ],
    total_interviews: 7,
    created_at: '2024-06-22T13:50:00Z',
    updated_at: '2024-06-22T13:50:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 85.6,
    avg_evaluation_scores: [
      { communication: 88 },
      { technical_skills: 83 },
      { problem_solving: 86 },
      { punctuality: 87 },
      { teamwork: 84 },
    ],
    total_interviews: 11,
    created_at: '2024-07-30T08:40:00Z',
    updated_at: '2024-07-30T08:40:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 70.1,
    avg_evaluation_scores: [
      { communication: 72 },
      { technical_skills: 68 },
      { problem_solving: 70 },
      { punctuality: 73 },
      { teamwork: 69 },
    ],
    total_interviews: 6,
    created_at: '2024-08-12T17:05:00Z',
    updated_at: '2024-08-12T17:05:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 89.4,
    avg_evaluation_scores: [
      { communication: 92 },
      { technical_skills: 88 },
      { problem_solving: 90 },
      { punctuality: 91 },
      { teamwork: 87 },
    ],
    total_interviews: 10,
    created_at: '2024-09-25T12:30:00Z',
    updated_at: '2024-09-25T12:30:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 95.0,
    avg_evaluation_scores: [
      { communication: 96 },
      { technical_skills: 94 },
      { problem_solving: 95 },
      { punctuality: 97 },
      { teamwork: 93 },
    ],
    total_interviews: 15,
    created_at: '2024-10-10T10:10:00Z',
    updated_at: '2024-10-10T10:10:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 82.5,
    avg_evaluation_scores: [
      { communication: 84 },
      { technical_skills: 80 },
      { problem_solving: 83 },
      { punctuality: 84 },
      { teamwork: 82 },
    ],
    total_interviews: 9,
    created_at: '2024-11-03T14:25:00Z',
    updated_at: '2024-11-03T14:25:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 74.3,
    avg_evaluation_scores: [
      { communication: 76 },
      { technical_skills: 73 },
      { problem_solving: 75 },
      { punctuality: 77 },
      { teamwork: 74 },
    ],
    total_interviews: 7,
    created_at: '2024-12-19T09:55:00Z',
    updated_at: '2024-12-19T09:55:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 90.8,
    avg_evaluation_scores: [
      { communication: 93 },
      { technical_skills: 89 },
      { problem_solving: 91 },
      { punctuality: 92 },
      { teamwork: 88 },
    ],
    total_interviews: 13,
    created_at: '2025-01-07T11:35:00Z',
    updated_at: '2025-01-07T11:35:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 67.5,
    avg_evaluation_scores: [
      { communication: 70 },
      { technical_skills: 65 },
      { problem_solving: 68 },
      { punctuality: 69 },
      { teamwork: 66 },
    ],
    total_interviews: 5,
    created_at: '2025-02-14T15:45:00Z',
    updated_at: '2025-02-14T15:45:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 78.9,
    avg_evaluation_scores: [
      { communication: 80 },
      { technical_skills: 75 },
      { problem_solving: 78 },
      { punctuality: 79 },
      { teamwork: 76 },
    ],
    total_interviews: 8,
    created_at: '2025-03-21T13:20:00Z',
    updated_at: '2025-03-21T13:20:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 85.0,
    avg_evaluation_scores: [
      { communication: 87 },
      { technical_skills: 83 },
      { problem_solving: 85 },
      { punctuality: 86 },
      { teamwork: 84 },
    ],
    total_interviews: 10,
    created_at: '2025-04-30T16:00:00Z',
    updated_at: '2025-04-30T16:00:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 91.2,
    avg_evaluation_scores: [
      { communication: 93 },
      { technical_skills: 89 },
      { problem_solving: 91 },
      { punctuality: 92 },
      { teamwork: 90 },
    ],
    total_interviews: 14,
    created_at: '2025-05-18T10:50:00Z',
    updated_at: '2025-05-18T10:50:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 73.4,
    avg_evaluation_scores: [
      { communication: 75 },
      { technical_skills: 70 },
      { problem_solving: 73 },
      { punctuality: 74 },
      { teamwork: 72 },
    ],
    total_interviews: 6,
    created_at: '2025-06-25T12:15:00Z',
    updated_at: '2025-06-25T12:15:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 84.7,
    avg_evaluation_scores: [
      { communication: 86 },
      { technical_skills: 82 },
      { problem_solving: 85 },
      { punctuality: 83 },
      { teamwork: 81 },
    ],
    total_interviews: 9,
    created_at: '2025-07-09T14:40:00Z',
    updated_at: '2025-07-09T14:40:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 69.8,
    avg_evaluation_scores: [
      { communication: 72 },
      { technical_skills: 67 },
      { problem_solving: 70 },
      { punctuality: 71 },
      { teamwork: 68 },
    ],
    total_interviews: 5,
    created_at: '2025-08-16T09:30:00Z',
    updated_at: '2025-08-16T09:30:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 87.5,
    avg_evaluation_scores: [
      { communication: 89 },
      { technical_skills: 85 },
      { problem_solving: 88 },
      { punctuality: 90 },
      { teamwork: 86 },
    ],
    total_interviews: 11,
    created_at: '2025-09-23T17:25:00Z',
    updated_at: '2025-09-23T17:25:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 80.3,
    avg_evaluation_scores: [
      { communication: 82 },
      { technical_skills: 78 },
      { problem_solving: 80 },
      { punctuality: 81 },
      { teamwork: 79 },
    ],
    total_interviews: 8,
    created_at: '2025-10-31T11:10:00Z',
    updated_at: '2025-10-31T11:10:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 94.6,
    avg_evaluation_scores: [
      { communication: 96 },
      { technical_skills: 92 },
      { problem_solving: 94 },
      { punctuality: 95 },
      { teamwork: 93 },
    ],
    total_interviews: 16,
    created_at: '2025-11-07T08:05:00Z',
    updated_at: '2025-11-07T08:05:00Z',
  },
  {
    id: uuidv4(),
    interview_id: uuidv4(),
    avg_overall_score: 71.9,
    avg_evaluation_scores: [
      { communication: 74 },
      { technical_skills: 70 },
      { problem_solving: 72 },
      { punctuality: 73 },
      { teamwork: 71 },
    ],
    total_interviews: 6,
    created_at: '2025-12-14T13:55:00Z',
    updated_at: '2025-12-14T13:55:00Z',
  },
];
