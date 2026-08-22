# V2 migration reconciliation

The first three V2 migrations were applied manually to the production Supabase project during the production cutover. Their schema changes are present and have been verified, but those three timestamps are not yet present in `supabase_migrations.schema_migrations`.

Do **not** rerun their SQL against production. The database state is already correct.

## Manually applied migrations

These files exist in Git and their effects exist in production:

- `20260814102630_v2_practice_session_core.sql`
- `20260814133800_v2_personal_workspace_membership.sql`
- `20260819232000_v2_legacy_practice_imports.sql`

The later security migration was applied through the Supabase migration mechanism and is already recorded remotely:

- `20260822153505_v2_server_owned_table_grants.sql`

## Safe repair

Supabase's supported mechanism for this situation is `migration repair`. Marking a migration as applied updates migration tracking only; it does not execute the migration SQL again.

From a Supabase CLI environment linked to the production project, first inspect the state:

```bash
supabase migration list
```

Then mark only the three manually applied V2 migrations as applied:

```bash
supabase migration repair --status applied 20260814102630
supabase migration repair --status applied 20260814133800
supabase migration repair --status applied 20260819232000
```

Finally verify:

```bash
supabase migration list
supabase db push --dry-run
```

The dry run should not propose rerunning those three migrations.

## Why this is deliberately not automated here

The connected Supabase tooling available during the V2 cleanup supports executing SQL and applying new migrations, but it does not expose Supabase CLI's migration-repair operation. We intentionally do not modify the internal `supabase_migrations.schema_migrations` table by hand as a substitute.

Until the repair commands above are run, production runtime behavior is unaffected; the remaining issue is migration-history bookkeeping and future `db push`/branch reproducibility.

## Server-owned V2 table security

The V2 persistence tables have RLS enabled and intentionally have no browser policies. Production was additionally hardened by revoking direct table privileges from the `anon` and `authenticated` roles for:

- `practices`
- `practice_versions`
- `practice_questions`
- `rubric_criteria`
- `question_rubric_criteria`
- `sessions`
- `session_responses`
- `response_evaluations`
- `session_evaluations`
- `legacy_practice_imports`

Repository search confirmed that the V2 runtime does not use browser Supabase `.from(...)` access for these tables. Persistence goes through the server-side Postgres/Drizzle boundary.

`service_role` retains its database privileges. The legacy V1 tables and their policies/grants are outside this V2-specific hardening pass and should be handled separately if/when their application surfaces are retired.
