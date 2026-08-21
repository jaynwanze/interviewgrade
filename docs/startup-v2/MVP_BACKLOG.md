# InterviewGrade v2 MVP Backlog

## Product success condition

A creator can turn a scenario into a published practice, share it, have somebody complete it by voice, deliver useful rubric-based feedback, and inspect the result.

This backlog is intentionally ordered to build that loop before adding integrations, billing polish or secondary career features.

---

# Milestone 0 — Repository foundation

## V2-001 Bootstrap clean app

**Goal:** current-stable Next.js + TypeScript app with minimal dependencies.

Acceptance:

- app starts locally;
- production build succeeds;
- strict TypeScript enabled;
- pnpm lockfile committed;
- no copied legacy dependency manifest.

## V2-002 Add CI quality gates

Acceptance:

- pull requests run typecheck;
- lint;
- build;
- tests when test suite exists;
- failed checks block normal merge workflow.

## V2-003 Environment validation

Use Zod to validate server environment at startup.

Initial env groups:

```text
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
```

Service-role/storage variables only when needed.

---

# Milestone 1 — Identity and tenancy

## V2-010 Supabase Auth setup

Acceptance:

- sign up;
- login;
- logout;
- callback/session refresh;
- server helper can require an authenticated user.

## V2-011 Profiles

Acceptance:

- authenticated users have a profile row;
- display name can be updated;
- no candidate/employer user type.

## V2-012 Personal/default organisation

Acceptance:

- new creator receives/creates an organisation;
- membership row exists;
- server code verifies membership before organisation mutations.

---

# Milestone 2 — Practice authoring

## V2-020 Practice schema + repository

Implement:

```text
practices
practice_versions
practice_questions
rubric_criteria
question_rubric_criteria
```

Acceptance:

- migrations apply cleanly to empty DB;
- repositories have integration tests for ownership and CRUD.

## V2-021 Practice list

Creator sees:

```text
My Practices
+ New Practice

Title | status | last updated | completions
```

No elaborate dashboard required.

## V2-022 Manual practice editor

Fields:

```text
title
description
scenario
instructions
difficulty / estimated time optional
questions
rubric criteria
criterion weights
question↔criterion mapping
```

Acceptance:

- add/edit/delete/reorder questions;
- add/edit/delete/reorder criteria;
- total rubric weight validation;
- save draft.

## V2-023 Practice preview

Acceptance:

Creator can see approximately what the participant will see before publishing.

---

# Milestone 3 — AI-assisted creation

## V2-030 PracticeDraft schema

Structured schema with:

```text
title
description
scenario
instructions
questions[]
rubricCriteria[]
```

## V2-031 AI practice generator

Example:

```text
Input:
"Junior SaaS sales reps handling a price objection"

Output:
editable practice draft
```

Acceptance:

- provider response is schema constrained/validated;
- failures are user-safe and retryable;
- generator does not write directly to published content;
- creator can edit every generated field.

## V2-032 Generation UX

Preferred first screen:

```text
What should someone practise?
[                                             ]

[Generate Practice]
```

Then land in the normal editor populated with draft content.

---

# Milestone 4 — Publish and share

## V2-040 Publish validation

Reject publication if:

- scenario missing;
- no questions;
- no rubric criteria;
- rubric weights invalid;
- question has no assessable criterion where required.

## V2-041 Immutable published versions

Acceptance:

- publication creates version 1;
- editing draft does not mutate version 1;
- republishing creates version 2;
- old sessions still reference version 1.

## V2-042 Share slug/public URL

Acceptance:

```text
https://interviewgrade.io/p/<slug>
```

works for a published practice and unpublished/archived practices cannot be started publicly.

---

# Milestone 5 — Participant player

## V2-050 Public practice landing

Display:

- practice title;
- scenario;
- instructions;
- question count;
- estimated time;
- Start button.

## V2-051 Session creation

Acceptance:

- creates against current published version;
- supports anonymous participant initially;
- authenticated user ID linked when available;
- creator ownership is not required to participate.

## V2-052 Player state model

States:

```text
loading
ready
recording
transcribing
evaluating
feedback
complete
error
```

Acceptance:

- refresh can recover authoritative session/question progress;
- one network failure does not corrupt session state.

## V2-053 Question UI

Minimal screen:

```text
Practice title                  2 / 5

Scenario / question

[recording area]

[Start answer]
```

No creator sidebar/navigation.

---

# Milestone 6 — Voice and transcription

## V2-060 Recorder

Acceptance:

- microphone permission handling;
- start/stop;
- timer;
- visible recording status;
- cleanup MediaStream tracks;
- optional camera preview does not control ability to answer.

## V2-061 Transcription route/service

Acceptance:

- accepts supported browser audio upload;
- validates size/type;
- sends server-side to OpenAI transcription;
- returns transcript;
- provider key never reaches browser.

## V2-062 Browser compatibility pass

Test target browsers before adding conversion dependencies.

Rule:

> Do not add FFmpeg unless the compatibility test demonstrates a real failure that cannot be solved more simply.

---

# Milestone 7 — Rubric feedback

## V2-070 Response evaluation schema

Must include at minimum:

```text
score
criterionScores
summary
strengths
improvements
nextStep
```

## V2-071 Evaluation service

Acceptance:

- only relevant rubric/context sent;
- model output validates;
- model ID configurable centrally;
- timeout/retry policy centralized;
- no database mutation inside OpenAI adapter.

## V2-072 Persist response + evaluation

Acceptance:

- transcript is persisted before/independently of evaluation retry;
- evaluation is idempotent;
- criterion IDs are validated against practice version.

## V2-073 Feedback UI

```text
82 / 100

What you did well
✓ ...
✓ ...

Improve
→ ...
→ ...

[Try Again] [Continue]
```

Acceptance:

- retry creates another attempt instead of destroying previous attempt;
- Continue advances safely.

---

# Milestone 8 — Voice interviewer

## V2-080 TTS endpoint/service

Acceptance:

- speech generated server-side;
- audio returned in efficient normal response;
- errors fall back to readable text;
- model/voice centrally configurable.

## V2-081 Question speaker/player

Acceptance:

- play/replay controls;
- does not autoplay in a way blocked by browser policies without fallback;
- accessible text always present.

Avery persona/animation can be layered on after the functional experience is reliable.

---

# Milestone 9 — Session completion

## V2-090 Deterministic scoring

Acceptance:

- weighted criterion score calculation unit-tested;
- score bounds enforced;
- same stored inputs always produce same arithmetic aggregate.

## V2-091 Final qualitative synthesis

AI uses evaluated responses and deterministic scores to generate:

```text
strengths
improvements
recommendations
summary
```

## V2-092 Complete session transaction

Acceptance:

- only one final evaluation for schema version;
- session marked completed only after valid result persisted;
- retrying completion does not duplicate data.

## V2-093 Participant final report

Keep first version simple and useful.

---

# Milestone 10 — Creator results

## V2-100 Practice results overview

Show:

```text
Completions
Average score
Weakest criteria
Recent sessions
```

## V2-101 Individual session result

Creator can inspect:

- transcript per response;
- score/feedback;
- final evaluation.

## V2-102 Repeat attempt improvement

Where participant identity can be linked, show first vs latest attempt.

Do not build a full analytics warehouse.

---

# Milestone 11 — Product hardening

## V2-110 Critical E2E test

Automate:

```text
creator login
→ create practice
→ publish
→ public start
→ answer
→ feedback
→ finish
→ creator views result
```

Provider calls may use test fakes in CI.

## V2-111 Rate limiting / abuse controls

Protect public expensive endpoints:

- session start;
- transcription;
- evaluation;
- generation;
- TTS.

## V2-112 Data retention/deletion basics

Before pilots:

- participant/session deletion path;
- account deletion behavior;
- raw audio retention policy if audio is stored;
- privacy copy.

## V2-113 Observability

Track:

- AI latency/error rate;
- transcription latency/error rate;
- session completion rate;
- generation success rate;
- cost/usage by feature internally.

---

# Milestone 12 — Embed

## V2-120 Embed mode

```text
/p/<slug>?embed=1
```

Removes host marketing/nav chrome.

## V2-121 iframe documentation

Example snippet and allowed-origin guidance.

## V2-122 Parent completion event — only if needed

A small `postMessage` completion event can precede webhooks/API if embed customers need it.

---

# Milestone 13 — Billing

## V2-130 Organisation Stripe customer
## V2-131 Checkout + portal
## V2-132 Signed webhook
## V2-133 Subscription projection
## V2-134 Simple usage entitlement

Keep pricing configuration outside UI code.

---

# Milestone 14 — Pilot feedback, not speculative features

Once the first creators use the system, classify requests:

```text
repeated across customers → candidate SaaS feature
one-off but valuable       → paid configuration/service
rare edge case             → don't productize yet
```

Likely customer-pulled next features:

- assignments/invites;
- CSV export;
- human coach comments;
- brand/logo settings;
- webhook;
- LMS/SSO;
- reusable practice templates;
- scenario branching/free-form role-play.

None should delay the core MVP.

---

# Post-V2 product feature drafts

These are intentionally queued behind V2 reliability, polish, E2E coverage and cleanup.

## Upload document → Generate Practice

See [UPLOAD_DOCUMENT_PRACTICE.md](./UPLOAD_DOCUMENT_PRACTICE.md).

The first version should let a creator upload PDF, DOCX or TXT source material, optionally add a short instruction, and generate the same editable V2 PracticeDraft used by the existing AI creation flow. It must reuse the normal editor, preview, publish, session and scoring pipeline rather than creating a parallel document-specific architecture.

Do not begin implementation until the remaining V2 production-polish checklist in the feature draft is complete.

---

# Launch metrics

The MVP should capture product metrics that answer whether the problem is real:

```text
creator activation:
  % who publish first practice

time to value:
  median time signup → published practice

distribution:
  sessions started per published practice

learner engagement:
  practice completion rate
  retry rate

quality:
  creator/participant feedback on usefulness

improvement:
  score change between repeat attempts where available

reliability:
  transcription success
  evaluation success
  end-to-end completion without technical error
```

Avoid vanity metrics before these work.

---

# Definition of MVP done

MVP is done when:

- the full creator → participant → feedback → creator result loop is deployed;
- it works without manual database intervention;
- it has a critical E2E test;
- AI outputs are validated and failures are retryable;
- creator can produce more than interview content without code changes;
- at least one real pilot user can create and distribute a useful practice;
- the product is ready to learn from customers rather than ready to accumulate more speculative features.
