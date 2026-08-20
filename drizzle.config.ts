import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

import { getSupabaseDatabaseUrl } from './src/db/database-url';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    // Drizzle Kit uses Supabase session pooling; application runtime uses
    // transaction pooling through src/db/client.ts.
    url: getSupabaseDatabaseUrl('session'),
  },
  strict: true,
  verbose: true,
});
