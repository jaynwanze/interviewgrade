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
  mark: number;
  feedback: string;
};

export type StripeCheckoutSessionDetails = {
  customer_details: {
    name: string;
  };
  product?: {
    name: string;
    price: number;
    quantity: number;
  };
};
export type EvaluationScores = {
  id: string;
  name: string;
  score: number;
  feedback: string;
};

export type EmployerPreferences = {
  location: string;
  industry: string;
  skill: string;
};

export type RecentAttempt = {
  id: string;
  type: 'practice' | 'interview';
  date: string;
  skillFocus: string;
  score: number;
};

export type JobTracker = Table<'job_application_tracker'>;
export interface CandidateRow {
  id: string;
  city: string;
  country: string;
  phone_number: string;
  summary: string;
  role: string;
  industry: string;
  interview_skill_stats: CandidateSkillsStats[];
  practice_skill_stats: CandidateSkillsStats[];
  created_at: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export type CandidatePreferences = {
  location: string;
  industry: string;
  skills: string;
};

export type CandidateSkillsStats = {
  id: string;
  skill: string;
  avg_score: number;
  updated_at?: string;
  previous_avg?: number;
};

export type InterviewUpdate = Pick<
  Table<'interviews'>,
  'id' | 'status' | 'current_question_index'
> & {
  end_time?: string;
};
export type InterviewComplete = Pick<
  Table<'interviews'>,
  'id' | 'end_time' | 'status' | 'current_question_index'
>;
export type Token = Table<'tokens'>;
export type InterviewAnswerDetail = {
  question: string;
  answer: string;
  mark: number;
  feedback: string;
  evaluation_criteria_name: string;
};

export type InterviewAnswer = Table<'interview_answers'>;
export type EvaluationRubricType = {
  grade: string;
  percentage_range: string;
  description: string;
  order: number;
};

export type specificFeedbackType = {
  mark: number;
  summary: string;
  advice_for_next_question: string;
};

export type EvaluationCriteriaType = {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  rubrics: EvaluationRubricType[];
  is_system_defined: boolean;
  created_at: string;
};
export type InterviewEvaluationCriteriaType = {
  id: string;
  user_id?: string;
  template_id?: string;
  name: string;
  description: string;
  rubrics: EvaluationRubricType[];
  is_system_defined: boolean;
  created_at: string;
};
export type PracticeTemplate = Table<'templates'>;
export type InterviewTemplate = Table<'interview_templates'>;
export type Questions = Table<'questions'>;
export type Interview = Table<'interviews'>;
export type InterviewQuestion = Table<'interview_questions'>;
export type InterviewTemplateCategory = {
  category: Database['public']['Enums']['template_category'];
};
export type InterviewAnalytics = {
  template_id: string | null;
  interview_template_id: string | null;
  interview_title: string;
  interview_description: string;
  total_interviews: number;
  question_count: number;
  avg_overall_grade: number;
  avg_evaluation_criteria_scores: AvgEvaluationScores[];
  strengths_summary: string[];
  areas_for_improvement_summary: string[];
  recommendations_summary: string[];
  completed_interview_evaluations: InterviewEvaluation[];
  best_evaluation_crieria: string;
};
export type AvgEvaluationScores = {
  name: string;
  avg_score: number;
  feedback_summary: string[];
};
export type InterviewTemplateFilter = 'Category' | 'Company' | 'General';

export type InterviewMode = {
  name: Database['public']['Enums']['interview_mode'];
};

export type InterviewModeType = Database['public']['Enums']['interview_mode'];
export type InterviewEvaluation = Table<'interview_evaluations'>;
export type FeedbackData = {
  overall_grade: number;
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
// src/types/index.ts

export type Product = Table<'products'>;

export type Subscription = Table<'subscriptions'>;

export type NoSubscription = {
  type: 'no-subscription';
};

export type TrialSubscription = {
  type: 'trialing';
  trialStart: string;
  trialEnd: string;
  product: Product;
  subscription: Subscription;
};

export type ActiveSubscription = {
  type: 'active';
  product: Product;
  subscription: Subscription;
};

export type PastDueSubscription = {
  type: 'past_due';
  product: Product;
  subscription: Subscription;
};

export type CanceledSubscription = {
  type: 'canceled';
  product: Product;
  subscription: Subscription;
};

export type PausedSubscription = {
  type: 'paused';
  product: Product;
  subscription: Subscription;
};

export type IncompleteSubscription = {
  type: 'incomplete';
  product: Product;
  subscription: Subscription;
};

export type IncompleteExpiredSubscription = {
  type: 'incomplete_expired';
  product: Product;
  subscription: Subscription;
};

export type UnpaidSubscription = {
  type: 'unpaid';
  product: Product;
  subscription: Subscription;
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

export const mockCandidates: CandidateRow[] = [
  {
    id: 'c1',
    city: 'New York',
    country: 'United States',
    phone_number: '(555) 123-4567',
    summary: 'Highly motivated and skilled software engineer with a passion for developing innovative solutions. Alice excels in problem-solving and has a keen eye for detail and her strong communication skills enable her to collaborate seamlessly with cross-functional teams, making her an invaluable asset to any organization. Alice is always eager to learn and adapt to new technologies, continuously improving her skill set to stay ahead in the ever-evolving tech industry.',
    role: 'Software Engineer',
    industry: 'Tech',
    practice_skill_stats: [
      { id: '1', skill: 'Problem Solving', avg_score: 92, previous_avg: 90 },
      { id: '2', skill: 'Communication', avg_score: 88, previous_avg: 85 },
      { id: '3', skill: 'Teamwork', avg_score: 90, previous_avg: 88 },
    ],
    interview_skill_stats: [
      { id: 'p1', skill: 'Behavioural', avg_score: 89, previous_avg: 87 },
    ],
    created_at: '2024-04-29T10:00:00Z',
    full_name: 'Alice Anderson',
    avatar_url:
      '/images/candidates/aiony-haust-3TLl_97HNJo-unsplash.ico',
    email: 'alice@example.com',
  },
  {
    id: 'c2',
    city: 'San Francisco',
    country: 'United States',
    phone_number: '(555) 555-1234',
    summary: 'Full-stack developer with a focus on back-end optimization.',
    role: 'Full-Stack Developer',
    industry: 'Tech',
    practice_skill_stats: [
      { id: 'p2', skill: 'Problem Solving', avg_score: 83, previous_avg: 80 },
      { id: 'p3', skill: 'Communication', avg_score: 81, previous_avg: 76 },
    ],
    interview_skill_stats: [
      { id: '4', skill: 'Behavioural', avg_score: 85, previous_avg: 82 },
      { id: '5', skill: 'Technical', avg_score: 80, previous_avg: 78 },
    ],
    created_at: '2024-04-20T09:30:00Z',
    full_name: 'Bob Brown',
    avatar_url:
      '/images/candidates/irene-strong-v2aKnjMbP_k-unsplash.ico',
    email: 'bob@example.com',
  },
  {
    id: 'c3',
    city: 'Toronto',
    country: 'United States',
    phone_number: '(416) 999-0000',
    summary: 'Skilled data analyst passionate about Decision Making & stats.',
    role: 'Data Analyst',
    industry: 'Tech',
    practice_skill_stats: [],
    interview_skill_stats: [
      { id: '6', skill: 'Behavioural', avg_score: 88, previous_avg: 85 },
      {
        id: '7',
        skill: 'Technical',
        avg_score: 90,
        previous_avg: 88,
      },
    ],
    created_at: '2024-04-22T14:15:00Z',
    full_name: 'Charlie Davis',
    avatar_url:
      '/images/candidates/charles-deluvio-7lXJ7Vqch9Y-unsplash.ico',
    email: 'charlie@example.com',
  },
  {
    id: 'c4',
    city: 'Remote',
    country: 'Remote',
    phone_number: '(555) 999-9999',
    summary: 'Problem solver with a knack for creative solutions.',
    role: 'Product Manager',
    industry: 'Tech',
    practice_skill_stats: [
      { id: '8', skill: 'Problem Solving', avg_score: 90, previous_avg: 85 },
      { id: '9', skill: 'Leadership', avg_score: 87, previous_avg: 86 },
    ],
    interview_skill_stats: [
      { id: 'p4', skill: 'Behavioural', avg_score: 88, previous_avg: 84 },
    ],
    created_at: '2024-04-25T11:45:00Z',
    full_name: 'Diana Evans',
    avatar_url:
      '/images/candidates/christopher-campbell-rDEOVtE7vOs-unsplash.ico',
    email: 'diana@example.com',
  },
  {
    id: 'c5',
    city: 'Dublin',
    country: 'Ireland',
    phone_number: '+353 12 345 6789',
    summary: 'Focused on continuous improvement and quick learning.',
    role: 'Software Engineer',
    industry: 'Tech',
    practice_skill_stats: [
      { id: '10', skill: 'Adaptability', avg_score: 92, previous_avg: 90 },
      { id: '11', skill: 'Communication', avg_score: 84, previous_avg: 80 },
    ],
    interview_skill_stats: [
      { id: 'p5', skill: 'Behavioural', avg_score: 88, previous_avg: 85 },
    ],
    created_at: '2024-04-27T07:00:00Z',
    full_name: 'Erin Green',
    avatar_url:
      '/images/candidates/microsoft-365-7mBictB_urk-unsplash.jpg',
    email: 'erin@example.com',
  },
];
