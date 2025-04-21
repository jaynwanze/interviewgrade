import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './lib/database.types';
import { ResumeMetadata } from './utils/zod-schemas/resumeMetaDataSchema';
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

export type CourseRec = {
  id: string;
  title: string;
  provider: string;
  length_minutes: number;
  url: string;
  tags: string[];
  type?: string;
};

export type SkillBundle = {
  stats: CandidateSkillsStats;
  courses: CourseRec[];
};

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

export type EmployerCandidatePreferences = {
  location: string;
  industry: string;
  skills: string;
  job: string;
};

export type RecentAttempt = {
  interview_id: string;
  interview_mode: 'practice' | 'interview';
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
  resume_metadata?: ResumeMetadata;
  created_at: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}
export type Candidate = Table<'candidates'>;

export type CandidateDetailsView = {
  id: string;
  city: string;
  country: string;
  phone_number: string;
  summary: string;
  role: string;
  industry: string;
  practice_skill_stats: CandidateSkillsStats[];
  interview_skill_stats: CandidateSkillsStats[];
  created_at: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  linkedin_url?: string;
  resume_url?: string;
  resume_metadata?: ResumeMetadata;
  recentAttempts?: RecentAttempt[];
  isUnlocked?: boolean;
};
export type CandidateSkillsStats = {
  template_id: string;
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
  mark?: number;
  summary?: string;
  advice_for_next_question?: string;
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
export type PracticeTemplate = Table<'templates'> & {
  isComingSoon?: boolean;
};
export type InterviewTemplate = Table<'interview_templates'> & {
  isComingSoon?: boolean;
};
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
  img_url: string | null;
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
    country: 'Ireland',
    phone_number: '(555) 123-4567',
    summary:
      'Highly motivated and skilled software engineer with a passion for developing innovative solutions. Alice excels in problem-solving and has a keen eye for detail and her strong communication skills enable her to collaborate seamlessly with cross-functional teams, making her an invaluable asset to any organization. Alice is always eager to learn and adapt to new technologies, continuously improving her skill set to stay ahead in the ever-evolving tech industry.',
    role: 'Software Engineer',
    industry: 'Information Technology & Software',
    practice_skill_stats: [
      {
        template_id: '1',
        skill: 'Problem Solving',
        avg_score: 92,
        previous_avg: 90,
      },
      {
        template_id: '2',
        skill: 'Decision Making',
        avg_score: 88,
        previous_avg: 85,
      },
      { template_id: '3', skill: 'Teamwork', avg_score: 90, previous_avg: 88 },
    ],
    interview_skill_stats: [
      {
        template_id: 'p1',
        skill: 'Behavioural',
        avg_score: 89,
        previous_avg: 87,
      },
    ],
    resume_metadata: {
      skills: ['Python', 'React', 'Docker'],
      experiences: [
        {
          jobTitle: 'Software Engineer',
          company: 'Acme Corp',
          startDate: '2022-05-01',
          endDate: null,
          description:
            'Developed microservices in Node.js and maintained Docker containers...',
        },
      ],
      education: 'Bachelor of Science in Computer Science, Some University',
      certifications: ['AWS Certified Solutions Architect'],
      projects: [
        {
          title: 'Open Source CLI Tool',
          description: 'A CLI tool for data scraping. Implemented in Python...',
          link: 'https://github.com/username/cli-tool',
        },
        {
          title: 'Personal Portfolio',
          description:
            'A React-based personal site with blog and resume sections',
          link: null,
        },
      ],
    },
    created_at: '2024-04-29T10:00:00Z',
    full_name: 'Alice Anderson',
    avatar_url: '/images/candidates/aiony-haust-3TLl_97HNJo-unsplash.ico',
    email: 'alice@example.com',
  },
  {
    id: 'c2',
    city: 'San Francisco',
    country: 'Ireland',
    phone_number: '(555) 555-1234',
    summary: 'Full-stack developer with a focus on back-end optimization.',
    role: 'Full-Stack Developer',
    industry: 'Information Technology & Software',
    practice_skill_stats: [
      {
        template_id: 'p2',
        skill: 'Problem Solving',
        avg_score: 83,
        previous_avg: 80,
      },
      {
        template_id: 'p3',
        skill: 'Adaptability',
        avg_score: 81,
        previous_avg: 76,
      },
    ],
    interview_skill_stats: [
      {
        template_id: '4',
        skill: 'Behavioural',
        avg_score: 85,
        previous_avg: 82,
      },
      { template_id: '5', skill: 'Technical', avg_score: 80, previous_avg: 78 },
    ],
    resume_metadata: {
      skills: ['JavaScript', 'Node.js', 'PostgreSQL'],
      experiences: [
        {
          jobTitle: 'Full-Stack Developer',
          company: 'Tech Innovations',
          startDate: '2021-03-01',
          endDate: null,
          description: 'Led the development of a scalable web application...',
        },
      ],
      education: 'Master of Science in Software Engineering, Tech University',
      certifications: ['Certified Kubernetes Administrator'],
      projects: [
        {
          title: 'E-commerce Platform',
          description:
            'Built a full-stack e-commerce platform using MERN stack...',
          link: null,
        },
      ],
    },
    created_at: '2024-04-20T09:30:00Z',
    full_name: 'Bob Brown',
    avatar_url: '/images/candidates/irene-strong-v2aKnjMbP_k-unsplash.ico',
    email: 'bob@example.com',
  },
  {
    id: 'c3',
    city: 'Toronto',
    country: 'United States',
    phone_number: '(416) 999-0000',
    summary: 'Skilled data analyst passionate about Decision Making & stats.',
    role: 'Data Analyst',
    industry: 'Information Technology & Software',
    practice_skill_stats: [],
    interview_skill_stats: [
      {
        template_id: '6',
        skill: 'Behavioural',
        avg_score: 88,
        previous_avg: 85,
      },
    ],
    resume_metadata: {
      skills: ['SQL', 'Python', 'Tableau'],
      experiences: [
        {
          jobTitle: 'Data Analyst',
          company: 'Data Insights',
          startDate: '2023-01-01',
          endDate: null,
          description:
            'Analyzed large datasets to provide actionable insights for clients...',
        },
      ],
      education: 'Bachelor of Arts in Statistics, Data University',
      certifications: ['Google Data Analytics Professional Certificate'],
      projects: [
        {
          title: 'Sales Forecasting Model',
          description:
            'Developed a predictive model for sales forecasting using Python...',
          link: null,
        },
        {
          title: 'Customer Segmentation Analysis',
          description:
            'Performed customer segmentation analysis using clustering techniques...',
          link: null,
        },
      ],
    },
    created_at: '2024-04-22T14:15:00Z',
    full_name: 'Charlie Davis',
    avatar_url: '/images/candidates/charles-deluvio-7lXJ7Vqch9Y-unsplash.ico',
    email: 'charlie@example.com',
  },
  {
    id: 'c4',
    city: 'Remote',
    country: 'Remote',
    phone_number: '(555) 999-9999',
    summary: 'Problem solver with a knack for creative solutions.',
    role: 'Product Manager',
    industry: 'Information Technology & Software',
    practice_skill_stats: [
      {
        template_id: '8',
        skill: 'Problem Solving',
        avg_score: 60,
        previous_avg: 85,
      },
      {
        template_id: '9',
        skill: 'Conflict Resolution',
        avg_score: 87,
        previous_avg: 86,
      },
    ],
    interview_skill_stats: [
      {
        template_id: 'p4',
        skill: 'Behavioural',
        avg_score: 88,
        previous_avg: 84,
      },
    ],
    resume_metadata: {
      skills: ['Agile', 'Scrum', 'Project Management'],
      experiences: [
        {
          jobTitle: 'Product Manager',
          company: 'Innovatech',
          startDate: '2022-06-01',
          endDate: null,
          description:
            'Led cross-functional teams to deliver high-impact products...',
        },
      ],
      education: 'Master of Business Administration, Business University',
      certifications: ['Certified Scrum Product Owner'],
      projects: [
        {
          title: 'New Product Launch',
          description:
            'Managed the launch of a new product line, achieving 20% market share in the first quarter...',
          link: null,
        },
      ],
    },
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
    industry: 'Information Technology & Software',
    practice_skill_stats: [
      {
        template_id: '10',
        skill: 'Adaptability',
        avg_score: 92,
        previous_avg: 90,
      },
      {
        template_id: '11',
        skill: 'Conflict Resolution',
        avg_score: 84,
        previous_avg: 80,
      },
    ],
    interview_skill_stats: [
      {
        template_id: 'p5',
        skill: 'Behavioural',
        avg_score: 88,
        previous_avg: 85,
      },
    ],
    resume_metadata: {
      skills: ['Java', 'Spring Boot', 'MySQL'],
      experiences: [
        {
          jobTitle: 'Junior Software Engineer',
          company: 'Tech Solutions',
          startDate: '2023-02-01',
          endDate: null,
          description:
            'Assisted in the development of web applications using Java and Spring Boot...',
        },
      ],
      education: 'Bachelor of Science in Computer Science, Tech University',
      certifications: ['Oracle Certified Java Programmer'],
      projects: [
        {
          title: 'Web Application Development',
          description:
            'Contributed to the development of a web application using Java and Spring Boot...',
          link: null,
        },
      ],
    },
    created_at: '2024-04-27T07:00:00Z',
    full_name: 'Erin Green',
    avatar_url: '/images/candidates/microsoft-365-7mBictB_urk-unsplash.jpg',
    email: 'erin@example.com',
  },
];

export const COMING_SOON_TEMPLATES: PracticeTemplate[] = [
  {
    id: 'coming-soon-2',
    user_id: '',
    category: 'General Skills-Based',
    title: 'Emotional Intelligence',
    role: '',
    skill: '',
    description: 'Coming soon! Sharpen your EI and empathy in the workplace.',
    duration: 10,
    difficulty: 'Medium',
    question_count: 3,
    company: '',
    is_company_specific: false,
    is_industry_specific: false,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },

  {
    id: 'coming-soon-3',
    user_id: '',
    category: 'General Skills-Based',
    title: 'Teamwork',
    role: '',
    skill: '',
    description: 'Coming soon! Collaborate effectively with your team.',
    duration: 10,
    difficulty: 'Medium',
    question_count: 3,
    company: '',
    is_company_specific: false,
    is_industry_specific: false,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },

  {
    id: 'coming-soon-4',
    user_id: '',
    category: 'General Skills-Based',
    title: 'Stess Management',
    role: '',
    skill: '',
    description: 'Coming soon! Learn to manage stress effectively.',
    duration: 10,
    difficulty: 'Medium',
    question_count: 3,
    company: '',
    is_company_specific: false,
    is_industry_specific: false,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },

  {
    id: 'coming-soon-5',
    user_id: '',
    category: 'General Skills-Based',
    title: 'Motivation',
    role: '',
    skill: '',
    description: 'Coming soon! Learn how to stay motivated and inspire others.',
    duration: 10,
    difficulty: 'Medium',
    question_count: 3,
    company: '',
    is_company_specific: false,
    is_industry_specific: false,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },
  {
    id: 'coming-soon-6',
    user_id: '',
    category: 'General Skills-Based',
    title: 'Leadership',
    role: '',
    skill: '',
    description:
      'Coming soon! Develop your leadership skills and inspire others.',
    duration: 10,
    difficulty: 'Medium',
    question_count: 3,
    company: '',
    is_company_specific: false,
    is_industry_specific: false,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },
];

export const COMING_SOON_MOCK_TEMPLATES: InterviewTemplate[] = [
  {
    id: 'coming-soon-102',
    user_id: '',
    category: 'IT',
    title: 'Technical',
    description: 'Coming soon! Prepare for technical interviews.',
    duration: 20,
    difficulty: 'Medium',
    question_count: 6,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },

  {
    id: 'coming-soon-103',
    user_id: '',
    category: 'Finance',
    title: 'Financial Services',
    description:
      'Prepare for financial analyst interviews with targeted questions. (Coming Soon)',
    duration: 20,
    difficulty: 'Medium',
    question_count: 6,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },

  {
    id: 'coming-soon-104',
    user_id: '',
    category: 'HR',
    title: 'Human Resources',
    description:
      'Strengthen your HR expertise with scenario-based questions on policy, culture, and compliance. (Coming Soon)',
    duration: 15,
    difficulty: 'Easy',
    question_count: 4,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },
  {
    id: 'coming-soon-105',
    user_id: '',
    category: 'Marketing',
    title: 'Digital Marketing',
    description:
      'Practice questions around campaign strategies, analytics, and growth tactics. (Coming Soon)',
    duration: 20,
    difficulty: 'Medium',
    question_count: 5,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    img_url: '',

    isComingSoon: true,
  },
  {
    id: 'coming-soon-106',
    user_id: '',
    category: 'Customer Service',
    title: 'Customer Service ',
    description:
      'Focus on customer satisfaction, conflict resolution, and communication. (Coming Soon)',
    duration: 15,
    difficulty: 'Easy',
    question_count: 5,
    is_general: true,
    is_system_defined: false,
    created_at: new Date().toISOString(),
    isComingSoon: true,
    img_url: '',
  },
];
