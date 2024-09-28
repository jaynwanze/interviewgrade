import { Database } from '@/lib/database.types';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

export const createSupabaseUserServerPagesClient = ({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}) => {
  return createPagesServerClient<Database>(
    {
      req,
      res,
    },
    {
      options: {
        global: {
          fetch,
        },
      },
    },
  );
};
