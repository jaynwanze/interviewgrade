# InterviewGrade v2 Migration Plan

## Principle

This is a **rebuild with selective migration**, not a rewrite from memory and not an in-place cleanup of every legacy feature.

The legacy repository stays deployable/reference-only while the new repository grows vertically through the core product loop.

---

## Phase 0 — Preserve the legacy system

Before v2 implementation:

- keep `jaynwanze/interviewgrade` as the historical/FYP source of truth;
- do not perform broad delete/refactor work on `master`;
- tag or note the last known legacy production release if useful;
- retain Supabase migrations and production data independently;
- migrate knowledge/code selectively, not entire folders.

The `docs/startup-v2` directory is the handoff blueprint.

---

## Phase 1 — Bootstrap the new repository

Create an empty GitHub repository named preferably:

```text
jaynwanze/interviewgrade-v2
```

Bootstrap with the current stable Next.js release at implementation time.

Initial dependencies only:

```text
next
react
react-dom
typescript
zod
drizzle-orm
postgres (or the selected Drizzle postgres driver)
@supabase/ssr
@supabase/supabase-js
openai
clsx/tailwind-merge as required by UI
shadcn/ui dependencies actually used
```

Add Stripe only when billing starts. Add charting only when the results dashboard requires a chart. Do not copy legacy dependencies.

### Initial quality gates

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

CI should run at least typecheck, lint and build immediately.

---

## Phase 2 — Database and auth foundation

Implement the schema in `DATABASE_MODEL.md` with Drizzle.

First tables:

```text
profiles
organizations
organization_members
practices
practice_versions
practice_questions
rubric_criteria
question_rubric_criteria
sessions
session_responses
response_evaluations
session_evaluations
```

Create:

```text
src/db/client.ts
src/db/schema/*
src/modules/auth/require-user.ts
src/modules/auth/get-optional-user.ts
src/modules/auth/require-org-member.ts
```

### Legacy source references

Use these only to understand behavior:

```text
src/utils/server/verifySession.ts
src/utils/server/serverGetLoggedInUser.ts
src/data/user/organizations.ts
supabase/migrations/*
```

Do not port the five legacy Supabase client wrappers or the full RLS policy set.

### Acceptance

- sign up / sign in works;
- profile exists;
- creator has a personal/default organisation;
- authenticated server action can prove organisation membership;
- a direct attempt to access another organisation's practice is rejected.

---

## Phase 3 — Creator Practice CRUD

Implement the first real vertical slice without AI.

### Screens

```text
/dashboard/practices
/dashboard/practices/new
/dashboard/practices/[practiceId]/edit
```

### Capabilities

- create draft;
- edit title, description, scenario and instructions;
- add/reorder/remove questions;
- add/reorder/remove rubric criteria;
- assign criterion weights;
- map questions to criteria;
- save draft;
- preview.

### Legacy source references

```text
src/components/Interviews/CreateCustomInterviewDialog.tsx
src/data/user/custom-interview-builder.ts
```

Do not copy their persistence code.

### Acceptance

A creator can build this without touching SQL/admin tooling:

```text
Price Objection Practice
Scenario: prospect says the product is too expensive
Questions: 3
Rubric: discovery 30, communication 20, objection handling 30, closing 20
```

---

## Phase 4 — Publishing and versioning

Implement `publishPractice()` transactionally.

Publishing must:

1. validate required content;
2. validate question count;
3. validate rubric weights;
4. create immutable published version;
5. attach copied/versioned questions and criteria;
6. generate a unique share slug;
7. set `current_published_version_id`;
8. return the public URL.

### Acceptance

- published URL works;
- editing draft after publication does not change the live version until republished;
- old sessions continue referencing their original version.

---

## Phase 5 — AI Practice Generation

Implement the feature that materially changes creator speed.

Endpoint/server action:

```text
generatePracticeDraft(objective)
```

Example input:

```text
Create a practice for junior SaaS reps handling a prospect who says the product costs too much.
```

Validated output:

```text
title
description
scenario
questions
rubric criteria
weights
rubric descriptors
```

### Important difference from legacy

The legacy `createInterviewFromJobDescription()` uses hand-written keyword matching. v2 should use a schema-constrained AI draft generator. AI creates an editable draft only; the user publishes.

### Acceptance

- malformed provider output cannot enter DB;
- generated draft is editable before save/publish;
- a useful exercise can be created from one paragraph in roughly one minute of user effort.

---

## Phase 6 — Public Practice Landing + Session Creation

Implement:

```text
/p/[slug]
```

Landing page shows:

- title;
- scenario;
- estimated time;
- number of questions;
- start button;
- optional participant name/email collection.

`startSession()` creates a session referencing the current published version.

### Acceptance

A user with the link can start without entering the creator dashboard.

---

## Phase 7 — Voice Recorder + Transcription

Build a focused recorder component from lessons in legacy `UserCamera.tsx`.

### Migrate concepts

- permissions;
- record/stop controls;
- timer;
- microphone feedback;
- retry handling.

### Do not port by default

- FFmpeg WASM conversion;
- complex preferred-camera selection;
- Web Speech fallback unless testing demonstrates a need;
- video upload.

Send the native MediaRecorder blob to the server transcription route.

### Acceptance

- Chrome/Edge/Safari target set can submit a spoken response;
- transcription errors are retryable;
- no answer is lost when an evaluation request fails;
- transcription latency is visible to the UI state.

---

## Phase 8 — Response Evaluation

Implement clean structured rubric evaluation.

Legacy reference:

```text
src/utils/openai/getQuestionFeedback.ts
```

New flow:

```text
transcript
  ↓
EvaluationService
  ↓
validated structured provider response
  ↓
deterministic normalization/score calculation
  ↓
response_evaluations
```

Feedback UI should prioritize:

```text
Score
What went well
What to improve
Concrete next step
Try Again / Continue
```

### Acceptance

- every returned evaluation validates against schema;
- scores are within allowed bounds;
- criterion IDs always belong to that question/version;
- retries do not duplicate data;
- participant can retry and keep attempt history.

---

## Phase 9 — TTS / interviewer voice

Migrate the useful Avery behavior after the text practice player is stable.

Legacy references:

```text
src/utils/openai/textToSpeech.ts
src/components/Interviews/InterviewFlow/AIQuestionSpeaker.tsx
```

New implementation:

- narrow speech endpoint/service;
- stream/serve normal audio rather than base64 where practical;
- cache published question speech where useful;
- audio controls/accessibility;
- visual persona optional.

TTS must not block the ability to complete a practice if speech generation fails.

---

## Phase 10 — Session Completion + Final Result

After all required questions have final attempts:

- compute deterministic aggregate scores;
- generate qualitative summary from validated response results;
- persist one idempotent session evaluation;
- mark session completed;
- render final result.

Legacy reference:

```text
src/utils/openai/getInterviewFeedback.ts
```

Do not port its side effects such as candidate-summary updates.

### Acceptance

Final score is reproducible from stored criterion scores and rubric weights; the AI is not responsible for arithmetic correctness.

---

## Phase 11 — Creator Results Dashboard

First creator analytics page:

```text
/dashboard/practices/[practiceId]/results
```

Show:

- completions;
- average score;
- average criterion scores;
- recent participants/sessions;
- individual result drill-down;
- first vs latest attempt when a participant has repeat sessions.

No complex chart suite is required. Start with cards/table and one simple visual only if it improves comprehension.

---

## Phase 12 — Embed

After the public player is stable:

```html
<iframe
  src="https://interviewgrade.io/p/abc123?embed=1"
  title="InterviewGrade practice"
></iframe>
```

Requirements:

- embed mode removes marketing/navigation chrome;
- responsive layout;
- explicit CSP/frame-ancestor policy;
- configurable completion redirect/message later;
- same authoritative hosted player code, not a separate frontend.

This is the first Stripe-like distribution primitive.

---

## Phase 13 — Billing

Only now introduce creator/org billing.

Start simple:

```text
Free / Pilot
Paid creator/org plan
session allowance or fair-use limit
```

No employer unlock tokens and no huge B2C feature matrix.

Stripe tasks:

- current API version;
- checkout;
- billing portal;
- webhook signature validation;
- subscription projection in DB;
- simple entitlement function.

---

## Phase 14 — Customer-pulled integrations

Build only after real requests.

Expected order:

1. completion webhook;
2. programmatic session creation;
3. result retrieval API;
4. LMS/SSO if institutional deal requires it;
5. React SDK only after repeat developer adoption.

---

# Source-to-target migration map

| Legacy source | v2 target | Treatment |
| --- | --- | --- |
| `src/utils/server/verifySession.ts` | `modules/auth/*` | Rewrite/simplify |
| `src/supabase-clients/*` | `integrations/supabase/*` | Collapse drastically |
| `src/data/user/organizations.ts` | `modules/organization/*` | Migrate concept only |
| `templates` + `interview_templates` | `practices` + versions | Replace |
| criteria table pairs | `rubric_criteria` | Replace |
| `questions` | `practice_questions` | Migrate domain concept |
| `src/components/Interviews/CreateCustomInterviewDialog.tsx` | creator practice editor | Redesign/rewrite |
| `custom-interview-builder.ts` | `practice.service` + generation | Rewrite |
| `startInterviewAction` | `session.service.startSession` | Rewrite |
| `interviews` | `sessions` | Replace |
| `interview_questions` | versioned practice questions | Replace snapshot approach |
| `interview_answers` | `session_responses` | Replace |
| `interview_evaluations` | response/session evaluations | Split/normalize |
| `InterviewFlow.tsx` | `PracticePlayer` | Rewrite |
| `UserCamera.tsx` | `Recorder` | Selective behavior migration |
| `mediaRecorder.ts` | recorder utility | Rewrite without FFmpeg initially |
| `transcribeInterviewAudio.ts` | `audio/transcription.service.ts` | Rewrite cleanly |
| `textToSpeech.ts` | `audio/speech.service.ts` | Rewrite cleanly |
| `getQuestionFeedback.ts` | response evaluation service | Preserve rubric intent; rewrite provider contract |
| `getInterviewFeedback.ts` | session evaluation service | Split side effects; rewrite |
| candidate analytics JSON | aggregate queries | Do not migrate |
| `getCandidateSummary.ts` | none MVP | Freeze |
| employer route tree | creator org dashboard | Replace |
| token/unlock logic | none | Do not migrate |
| candidate subscriptions | org billing later | Replace later |
| sentiment route/model | none MVP | Freeze |
| resume parser/job tracker | none MVP | Freeze/delete from scope |

---

# What not to do during migration

Do not:

- copy `package.json`;
- copy `src/types.ts`;
- replay legacy Supabase migrations;
- copy the middleware and modify route names;
- preserve candidate/employer user types "for later";
- introduce `PracticeMode` and `InterviewMode` as separate architectures;
- build iframe/API/SDK simultaneously;
- migrate the employer marketplace because code already exists;
- optimize analytics before sessions exist;
- store every audio file by default;
- use a model call to calculate deterministic scores;
- clean unrelated legacy code just to make the old repo prettier.

---

# Cutover strategy

There is no reason for an early big-bang migration.

Recommended production transition:

```text
Legacy interviewgrade.io
        │
        ├── remains live while v2 is developed
        │
        └── v2 staged on preview/new subdomain
                         ↓
                  core loop validated
                         ↓
                   pilot creators
                         ↓
                 production cutover
```

If legacy users/data need preservation, add a deliberate migration script after v2 reaches feature completeness for the sessions we care about.

---

# Definition of migration complete

The technical migration is complete when:

- v2 supports the full creator → share → voice practice → feedback → results loop;
- v2 no longer imports or depends on legacy application code at runtime;
- core session data is represented by Practice/Version/Session/Evaluation, not Candidate/Interview;
- the team can remove Supabase hosting later by replacing infrastructure config rather than rewriting feature code;
- legacy repository is reference/archive, not a dependency.
