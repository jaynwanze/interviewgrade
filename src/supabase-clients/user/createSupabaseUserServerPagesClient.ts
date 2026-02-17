import { Database } from '@/lib/database.types';
import { createServerClient } from '@supabase/ssr';
import { NextApiRequest, NextApiResponse } from 'next';

export const createSupabaseUserServerPagesClient = ({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({
            name,
            value: req.cookies[name] || '',
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.setHeader(
              'Set-Cookie',
              `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${options?.maxAge ? `; Max-Age=${options.maxAge}` : ''}`,
            );
          });
        },
      },
    },
  );
};
