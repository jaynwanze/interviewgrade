# InterviewGrade Startup v2

This directory is the engineering blueprint for turning the original InterviewGrade final-year-project codebase into the startup product.

## Product direction

**InterviewGrade lets organisations turn real-world scenarios into AI-powered practice exercises that people can complete by voice, receive rubric-based feedback on, and improve through repetition.**

The first wedge remains interview and career-readiness practice. The core product is intentionally generic enough to support later verticals such as sales role-play, customer service, coaching and professional training without creating a new application for each vertical.

## Rebuild decision

We will **not** incrementally upgrade the current FYP application into v2. The current repository remains the reference implementation and source of proven product capabilities. A clean v2 repository will selectively migrate the valuable pieces into a smaller domain and modern architecture.

Reasons are documented in [CODE_AUDIT.md](./CODE_AUDIT.md), but the major ones are:

- candidate and employer concerns are deeply coupled into routing, middleware, data access and AI flows;
- practice and interview templates duplicate the same underlying domain;
- Supabase clients and RLS policies have become application architecture rather than infrastructure;
- the dependency surface is much larger than the v2 product needs;
- core session logic, AI evaluation and UI state are mixed together;
- several FYP/demo features are unrelated to the startup's first commercial workflow.

## Documents

- [CODE_AUDIT.md](./CODE_AUDIT.md) — current system, risks and KEEP / MIGRATE / REFACTOR / FREEZE / DELETE decisions.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — target v2 architecture and module boundaries.
- [DATABASE_MODEL.md](./DATABASE_MODEL.md) — proposed PostgreSQL / Drizzle model.
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) — ordered rebuild and source-to-target migration map.
- [MVP_BACKLOG.md](./MVP_BACKLOG.md) — build backlog and acceptance criteria.

## Target stack

- Next.js — current stable release at the time the v2 repository is bootstrapped
- React + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL
- Drizzle ORM + Drizzle migrations
- Supabase hosted Postgres, Auth and Storage only
- OpenAI for practice generation, transcription, speech and evaluation
- Stripe for organisation/creator billing
- Vercel for deployment
- Zod at every external boundary
- Playwright for critical end-to-end flows

Supabase is intentionally behind application boundaries. Most application code should never import `@supabase/supabase-js`.

## MVP definition

The first startup MVP is complete when this works end-to-end:

1. A creator signs in.
2. The creator creates a practice manually or from an AI-generated draft.
3. The practice contains a scenario, questions and a rubric.
4. The creator publishes it and receives a shareable URL.
5. A participant opens the URL and starts a session.
6. The participant answers each question by voice.
7. Audio is transcribed and the response is evaluated against the configured rubric.
8. The participant receives useful feedback.
9. The creator can see completion and result data.
10. Editing the practice later does not mutate historical sessions.

Everything outside that loop is secondary until the loop is reliable and customers use it.

## Explicitly out of MVP

Employer talent marketplace, candidate unlocking/tokens, resume matching, job-application tracking, sentiment/emotion scoring, course recommendations, white-labeling, LMS/SSO, public developer API, SDKs and complex cohort management are not part of the first v2 release.
