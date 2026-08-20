type SupabasePoolerMode = 'session' | 'transaction';

const INTERVIEWGRADE_SUPABASE_REGION = 'eu-central-1';

function getProjectRef(): string {
  const configuredRef = process.env.SUPABASE_PROJECT_REF?.trim();
  if (configuredRef) {
    return configuredRef;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      'SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL is required for server-side InterviewGrade persistence.',
    );
  }

  const hostname = new URL(supabaseUrl).hostname;
  const [projectRef] = hostname.split('.');

  if (!projectRef || projectRef === 'localhost' || projectRef === '127') {
    throw new Error(
      'Unable to derive the Supabase project ref from NEXT_PUBLIC_SUPABASE_URL.',
    );
  }

  return projectRef;
}

export function getSupabaseDatabaseUrl(
  mode: SupabasePoolerMode = 'transaction',
): string {
  const password = process.env.SUPABASE_DATABASE_PASSWORD;
  if (!password) {
    throw new Error(
      'SUPABASE_DATABASE_PASSWORD is required for server-side InterviewGrade persistence.',
    );
  }

  const projectRef = getProjectRef();
  const port = mode === 'transaction' ? 6543 : 5432;
  const username = `postgres.${projectRef}`;
  const poolerHost = `aws-0-${INTERVIEWGRADE_SUPABASE_REGION}.pooler.supabase.com`;

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${poolerHost}:${port}/postgres?sslmode=require`;
}
