import { Database } from '@/lib/database.types';
import { createServerClient } from '@supabase/ssr';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';

export const createSupabaseUserServerComponentClient = () => {
  // Keep this shared factory synchronous for the focused Next 15 security
  // migration. Next 15 provides this compatibility type for code that cannot
  // yet make the full caller chain asynchronous.
  const cookieStore = ((cookies() as unknown as UnsafeUnwrappedCookies) as unknown as UnsafeUnwrappedCookies) as unknown as UnsafeUnwrappedCookies;

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
