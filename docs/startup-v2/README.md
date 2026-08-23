# InterviewGrade Startup v2

This directory is the engineering/product blueprint for turning the original InterviewGrade final-year-project codebase into the startup product.

## Product direction

**InterviewGrade lets organisations turn real-world scenarios into AI-powered practice exercises that people can complete by voice, receive rubric-based feedback on, and improve through repetition.**

The first wedge remains interview and career-readiness practice. The core product is intentionally generic enough to support later verticals such as sales role-play, customer service, coaching and professional training without creating a new application for each vertical.

## V2 implementation decision

The original audit recommended a clean V2 repository. That approach was explored, then superseded by the implementation decision to **refactor the existing `interviewgrade` repository in place while isolating V2 behind new domain/application boundaries**.

The current repository is therefore both the legacy reference implementation and the active V2 product codebase.

The practical rules are:

- V2 Practice/session/evaluation code owns the current product path;
- frozen V1 surfaces remain only where they are still useful as compatibility/archive infrastructure;
- new V2 work should not deepen candidate/employer coupling;
- V2 persistence is server-owned behind application boundaries;
- destructive V1 cleanup is deferred until remaining compatibility reasons disappear;
- historical architecture/audit documents still explain why the old design needed separation, but `ROADMAP.md` is the source of truth for current sequencing.

The original risks remain documented in [CODE_AUDIT.md](./CODE_AUDIT.md), including duplicated template domains, legacy candidate/employer coupling and an oversized dependency/runtime surface.

## Documents

- [ROADMAP.md](./ROADMAP.md) — current product sequence, shipped state and active restart point.
- [DELIVERY_COACHING.md](./DELIVERY_COACHING.md) — speech-metrics → browser pose/framing → optional Supervision/server-vision sequence and guardrails.
- [PRODUCT_MODEL.md](./PRODUCT_MODEL.md) — lightweight V2 identity/authorization model: Anonymous/Signed in, Creator/Participant, and future workspace permissions.
- [LEGACY_CLEANUP.md](./LEGACY_CLEANUP.md) — current V1 → V2 port/freeze/transitional/delete decisions and safe cleanup sequence.
- [MIGRATION_RECONCILIATION.md](./MIGRATION_RECONCILIATION.md) — production V2 migration-history repair steps and server-owned table hardening record.
- [CODE_AUDIT.md](./CODE_AUDIT.md) — original/current system risks and KEEP / MIGRATE / REFACTOR / FREEZE / DELETE decisions.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — V2 architecture and module boundaries; read with the in-place refactor decision above where older clean-repo wording remains historical.
- [DATABASE_MODEL.md](./DATABASE_MODEL.md) — PostgreSQL / Drizzle V2 model.
- [SCORING.md](./SCORING.md) — canonical human-readable rubric mapping, response scoring and final-session aggregation rules.
- [DASHBOARD_VISION.md](./DASHBOARD_VISION.md) — north-star V2 progress dashboard, dynamic rubric analytics, V1 chart reuse and animation policy.
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) — ordered source-to-V2 migration map; some early clean-repo sequencing is historical.
- [MVP_BACKLOG.md](./MVP_BACKLOG.md) — original build backlog and acceptance criteria; use the roadmap for current priorities.
- [UPLOAD_DOCUMENT_PRACTICE.md](./UPLOAD_DOCUMENT_PRACTICE.md) — current PDF/TXT document-generation implementation plus deferred DOCX scope.

## Current stack direction

- Next.js + React + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL
- Drizzle ORM + migrations for the V2 persistence path
- Supabase hosted Postgres/Auth infrastructure where retained
- OpenAI for practice generation, transcription, speech and evaluation
- Stripe for current Free/Pro billing
- Vercel for deployment
- Zod at external boundaries
- Vitest/Playwright for focused unit/integration/E2E coverage

Supabase access for V2 persistence is intentionally server-owned. Browser roles should not receive direct access to V2 application tables.

## MVP definition

The first startup MVP is complete when this works end-to-end:

1. A creator signs in.
2. The creator creates a Practice manually, from AI, or from a supported document source.
3. The Practice contains a scenario, questions and a rubric.
4. The creator publishes it and receives a shareable URL.
5. A participant opens the URL and starts a session.
6. The participant answers each question by voice.
7. Audio is transcribed and the response is evaluated against the configured rubric.
8. The participant receives useful feedback and a final report.
9. The creator can inspect completion/results data.
10. Editing the Practice later does not mutate historical sessions.

The runtime loop above is shipped for the current V2 scope. Remaining work is launch hardening, evidence-driven polish and carefully sequenced product improvements rather than rebuilding the foundation again.

## Explicitly out of the current core MVP

Employer talent marketplace, candidate unlocking/tokens, resume matching, job-application tracking, sentiment/emotion scoring, course recommendations, white-labeling, LMS/SSO, public developer API, SDKs and complex cohort management are not part of the current core V2 release.

Visual delivery coaching, if validated later, must remain explainable and must not revive legacy emotion/sentiment scoring.
