import { Database } from '@/lib/database.types';
import { createServerClient } from '@supabase/ssr';
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers';

export const createSupabaseUserRouteHandlerClient = () => {
  // Next 15 keeps synchronous request API access as a compatibility path.
  // Preserve this factory's synchronous contract for existing callers during
  // the security upgrade; a later refactor can make the whole call chain async.
  const cookieStore = (cookies() as unknown as UnsafeUnwrappedCookies) as unknown as UnsafeUnwrappedCookies;

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
