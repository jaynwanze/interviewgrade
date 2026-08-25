# InterviewGrade Startup v2

This directory is the engineering/product blueprint for turning the original InterviewGrade final-year-project codebase into the startup product.

## Start here

For the current shipped state, production caveats and exact restart point, read:

- [CURRENT_STATUS.md](./CURRENT_STATUS.md) — concise current checkpoint and tomorrow restart point.
- [ROADMAP.md](./ROADMAP.md) — current sequencing after the shipped V2 foundation, AI Coach and Practice-context work.

Historical audit/migration documents remain useful for rationale, but they are not the source of truth for current priority.

## Product direction

**InterviewGrade lets people create role-specific interview Practices, complete them by voice, receive rubric-based feedback, and improve through repetition.**

The interview/career-readiness wedge is intentionally broad across roles and industries. Current product copy/examples should not imply that InterviewGrade is software-engineering-only.

## V2 implementation decision

The original audit recommended a clean V2 repository. That approach was explored, then superseded by the implementation decision to **refactor the existing `interviewgrade` repository in place while isolating V2 behind new domain/application boundaries**.

The current repository is therefore both the legacy reference implementation and the active V2 product codebase.

The practical rules are:

- V2 Practice/session/evaluation code owns the current product path;
- frozen V1 surfaces remain only where still needed for compatibility/archive infrastructure;
- new V2 work should not deepen candidate/employer coupling;
- V2 persistence is server-owned behind application boundaries;
- destructive V1 cleanup is deferred until compatibility reasons disappear;
- visible V1 feature/copy leaks in active V2 surfaces should be removed or refactored;
- historical architecture/audit documents explain why the old design needed separation, while `CURRENT_STATUS.md` and `ROADMAP.md` own current state/sequence.

## Current product model

- Authentication: **Anonymous / Signed in**.
- Product behavior: **Creator / Participant**; these are contextual capabilities, not permanent account roles.
- `Guest` means Anonymous Participant.
- Shared Practice participation remains account-free.
- **Free:** 3 AI-evaluated Practice runs + 3 AI-created Practices/month.
- **Pro (€9.99/month):** 30 AI-evaluated Practice runs + 30 AI-created Practices/month.
- Manual Practice creation/editing remains unlimited.

## Current shipped loop

The active product now supports:

1. A creator signs in.
2. The creator creates a Practice manually, with AI, or from PDF/TXT context.
3. Context creation can explicitly use a job description, résumé/CV or other source.
4. The Practice contains a scenario, questions and rubric.
5. The creator publishes it and receives a shareable URL.
6. A participant can open the shared Practice without an account.
7. The participant answers each question by voice.
8. Audio is transcribed and responses are evaluated against the published rubric.
9. The participant receives immediate feedback and a final rubric-weighted report.
10. The creator can inspect participant completion/results analytics.
11. A signed-in participant can ask report-grounded AI Coach questions on their own completed result.
12. Coach/report weaknesses can be turned into a new editable follow-up Practice.
13. Editing a Practice later does not mutate historical sessions because sessions remain pinned to immutable Practice versions.

The critical creator → guest participant → Q5/final report → creator Results path has Playwright smoke coverage.

## Documents

- [CURRENT_STATUS.md](./CURRENT_STATUS.md) — current shipped state, security/deployment caveats and restart point.
- [ROADMAP.md](./ROADMAP.md) — current product sequence.
- [AI_COACH_AND_PRACTICE_CONTEXT.md](./AI_COACH_AND_PRACTICE_CONTEXT.md) — Coach/context architecture and guardrails; the first slices described there are now implemented, while later persistence/combined-context phases remain future work.
- [DELIVERY_COACHING.md](./DELIVERY_COACHING.md) — objective speech metrics → browser visual coaching sequence and guardrails.
- [PRODUCT_MODEL.md](./PRODUCT_MODEL.md) — Anonymous/Signed in, Creator/Participant and future workspace permissions.
- [PRACTICE_RUN_ENTITLEMENTS.md](./PRACTICE_RUN_ENTITLEMENTS.md) — Practice-run accounting model; read with current 3/30 production limits.
- [LEGACY_CLEANUP.md](./LEGACY_CLEANUP.md) — V1 → V2 port/freeze/transitional/delete decisions.
- [MIGRATION_RECONCILIATION.md](./MIGRATION_RECONCILIATION.md) — migration-history repair and server-owned table hardening record.
- [CODE_AUDIT.md](./CODE_AUDIT.md) — original system risks and KEEP / MIGRATE / REFACTOR / FREEZE / DELETE decisions.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — V2 architecture/module boundaries; older clean-repo wording is historical where it conflicts with the in-place decision.
- [DATABASE_MODEL.md](./DATABASE_MODEL.md) — PostgreSQL / Drizzle V2 model.
- [SCORING.md](./SCORING.md) — rubric mapping, response scoring and final-session aggregation rules.
- [DASHBOARD_VISION.md](./DASHBOARD_VISION.md) — V2 progress/dashboard direction.
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) — source-to-V2 migration map; early clean-repo sequencing is historical.
- [MVP_BACKLOG.md](./MVP_BACKLOG.md) — original build backlog; do not use it instead of the roadmap for current priority.
- [UPLOAD_DOCUMENT_PRACTICE.md](./UPLOAD_DOCUMENT_PRACTICE.md) — PDF/TXT extraction implementation and deferred parser work; current source-kind behavior is also summarized in `CURRENT_STATUS.md`.

## Current stack direction

- Next.js + React + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL
- Drizzle ORM + migrations for V2 persistence
- Supabase hosted Postgres/Auth where retained
- OpenAI for Practice generation, transcription, speech, evaluation and grounded coaching
- Stripe for Free/Pro billing
- Vercel for deployment
- Zod at external boundaries
- Vitest/Playwright for focused unit/integration/E2E coverage

Supabase access for V2 persistence is intentionally server-owned. Browser roles should not receive direct write access to protected V2 application tables.

## Current non-goals

Employer talent marketplace, candidate unlocking/tokens, résumé employability scoring, candidate ranking/hiring prediction, job-application tracking, sentiment/emotion scoring, course recommendations, white-labeling, LMS/SSO, public developer API, SDKs and complex cohort management are not part of the current core product.

Visual delivery coaching, if validated later, must remain explainable and must not revive legacy emotion/sentiment/confidence/personality inference.
