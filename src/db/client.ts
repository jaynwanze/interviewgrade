import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required for server-side InterviewGrade persistence.',
    );
  }

  return databaseUrl;
}

type PostgresClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  interviewGradePostgresClient?: PostgresClient;
};

const client =
  globalForDatabase.interviewGradePostgresClient ??
  postgres(getDatabaseUrl(), {
    // Supabase transaction pooling does not support prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.interviewGradePostgresClient = client;
}

export const db = drizzle({ client, schema });
export type InterviewGradeDatabase = typeof db;
