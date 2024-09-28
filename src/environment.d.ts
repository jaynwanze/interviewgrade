declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      STRIPE_SECRET_KEY: string;
      NODE_ENV: 'test' | 'development' | 'production';
      PORT?: string;
      PWD: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      SUPABASE_PROJECT_REF: string;
      NEXT_PUBLIC_VERCEL_URL?: string;
      NEXT_PUBLIC_SITE_URL?: string;
      SUPABASE_JWT_SECRET: string;
      SENDGRID_API_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      ADMIN_EMAIL: string;
      NORDIGEN_BASE_URL: string;
      GOCARDLESS_SECRET_ID: string;
      GOCARDLESS_SECRET_KEY: string;
      RESEND_API_KEY: string;
      
    }
  }
}

// eslint-disable-next-line prettier/prettier
export {};
