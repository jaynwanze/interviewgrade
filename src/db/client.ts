import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import { getSupabaseDatabaseUrl } from './database-url';

type PostgresClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  interviewGradePostgresClient?: PostgresClient;
};

const client =
  globalForDatabase.interviewGradePostgresClient ??
  postgres(getSupabaseDatabaseUrl('transaction'), {
    // Supabase transaction pooling does not support prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.interviewGradePostgresClient = client;
}

export const db = drizzle({ client, schema });
export type InterviewGradeDatabase = typeof db;
