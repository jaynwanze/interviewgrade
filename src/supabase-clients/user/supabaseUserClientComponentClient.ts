// https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types';

// Singleton instance (recommended for client-side usage)
// This reuses the same client instance across your app
export const supabaseUserClientComponentClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
