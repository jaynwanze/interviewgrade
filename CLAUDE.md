# InterviewGrade

AI-powered mock interview platform. Candidates practice, employers find scored candidates.

## Stack

- **Frontend:** Next.js 14 (App Router, canary), React 18, Tailwind, shadcn/ui
- **Backend:** Next API routes + Server Actions, Supabase (Postgres + RLS, `@supabase/ssr`)
- **AI:** OpenAI GPT-4o + Whisper, Hugging Face DistilRoBERTa (sentiment)
- **Payments:** Stripe (subscriptions + token bundles)
- **Node:** 21.6.1 (`.nvmrc`), but `engines: ">=20.0.0"`. Vercel uses Node 24.x.
- **Package manager:** pnpm 9.0.6 (pinned in `packageManager`). Use `corepack enable` — do not `brew install pnpm` (version drift vs CI).

## Local dev

```bash
corepack enable                  # one-time, gives you pnpm
pnpm install
pnpm dev                         # http://localhost:3000
```

`.env.local` is required — middleware constructs a Supabase client on every request. Without real creds, the landing page renders but auth/data routes fail. See `src/environment.d.ts` for the full env-var list.

## Layout

- `src/app/(external-pages)/` — public landing, terms
- `src/app/(dynamic-pages)/(authenticated-pages)/(user-pages)/candidate/...` — candidate dashboard, interviews, billing
- `src/app/(dynamic-pages)/(authenticated-pages)/(user-pages)/employer/[organizationId]/...` — employer dashboard, candidate search, token purchase
- `src/middleware.ts` — session refresh + onboarding/access gates; runs on every route
- `src/utils/checkAccess.ts` — subscription-tier gating for interviews/features
- `supabase/migrations/` — schema, RLS policies, seeds in `supabase/seeds/`

## Commits & history

- Commit messages in this repo often understate scope (e.g. "Fix prettier warnings" = 120-file rewrite). **Always `git show --stat <sha>` before reverting** anything by message alone.
- `master` is the main/deploy branch (Vercel auto-deploys). PRs land here directly.
- File-casing matters: macOS dev is case-insensitive, Vercel/Linux is not. Imports must match disk casing exactly.

## Scripts

```bash
pnpm dev                  # next dev
pnpm build                # next build
pnpm lint                 # eslint --fix + prettier --write on src/
pnpm tsc                  # type-check only
pnpm test                 # vitest (src/)
pnpm test:e2e             # playwright
pnpm generate:types:local # regen src/lib/database.types.ts from local supabase
```

## Gotchas

- `next.config.mjs` currently has `ignoreBuildErrors` / `ignoreDuringBuilds` enabled — recent commits disabled build checks to push deploys through. Real type/lint errors are being masked. Fix before re-enabling.
- `images.domains` in `next.config.mjs` is deprecated; warning is harmless but should move to `images.remotePatterns`.
- `next-env.d.ts` regenerates on every `next dev` — ignore the resulting diff, don't commit.
