# InterviewGrade Legacy Code Audit

## Executive conclusion

The current application proves that the difficult product capabilities work: users can authenticate, launch structured interview/practice sessions, speak answers, transcribe audio, receive rubric-based AI feedback, view results, and organisations can exist in a multi-user model.

The correct startup move is **selective migration into a clean v2 repository**, not an in-place framework upgrade.

The legacy application was designed around two product identities — `candidate` and `employer` — while the startup product should be designed around two actions — **create practice** and **complete practice**. That difference reaches the route tree, database schema, middleware, billing, prompts and analytics, so preserving the legacy architecture would preserve the wrong abstraction.

---

## 1. Current architecture

### Runtime / application

- Next.js App Router, currently pinned to a Next 14 canary release.
- React 18 + TypeScript.
- Vercel deployment.
- Server Actions and Route Handlers mixed with a substantial client-component surface.
- Supabase Postgres, Auth, Storage and RLS.
- OpenAI for transcription, TTS, answer feedback and full-session evaluation.
- Hugging Face sentiment endpoint.
- Stripe subscriptions and employer token bundles.

### Main code areas

```text
src/
  actions/
  app/
  components/
  contexts/
  data/
  hooks/
  lib/
  supabase-clients/
  types/
  utils/
  types.ts
  middleware.ts
```

The code is primarily grouped by technical concern rather than by product/domain boundary. As a result, a single workflow frequently crosses `components`, `data`, `utils`, `supabase-clients` and global types.

### Route hierarchy

The main authenticated product tree is split first by user type:

```text
(dynamic-pages)
  (authenticated-pages)
    (user-pages)
      candidate/
      employer/
```

Candidate routes include dashboard, interviews, interview history, employer interests, settings and skill development. Employer routes are organisation-scoped and include dashboard/search/reporting/settings/token-purchase concerns.

This route hierarchy encodes the old business model into the application shell.

---

## 2. Authentication and authorization

Supabase Auth is a useful capability and can remain in v2, but the legacy implementation has too much business policy in auth metadata and middleware.

`src/middleware.ts` currently:

- instantiates the Supabase server client;
- refreshes user auth state;
- defines protected page prefixes;
- reads `userType` from auth metadata;
- redirects candidates away from employer routes and vice versa;
- enforces different candidate/employer onboarding flags;
- applies broad CORS headers.

This makes a request-wide infrastructure layer aware of old product concepts such as candidate details and employer preferences.

### v2 decision

**MIGRATE:** Supabase Auth as infrastructure and the concept of a `user_profiles` row linked to an auth user.

**REWRITE:** authorization and onboarding. Use simple server-side helpers such as `requireUser()`, `requireOrganizationMember()` and `requirePracticeOwner()` near the relevant use case. Keep RLS as a defence-in-depth tenant boundary rather than the primary place business workflows are encoded.

---

## 3. Database model

The current database contains useful primitives but also shows domain duplication caused by the old candidate/interview design.

Important tables include:

```text
user_profiles
candidates
employees
organizations
organization_members
organization_join_invitations

templates
interview_templates
evaluation_criteria
interview_evaluation_criteria
template_evaluation_criteria
interview_template_interview_evaluation_criteria
questions

interviews
interview_questions
interview_answers
interview_evaluations

products
subscriptions
tokens
employee_candidate_unlocks
job_application_tracker
```

### Core schema problem

There are parallel concepts for:

- `templates` vs `interview_templates`;
- `evaluation_criteria` vs `interview_evaluation_criteria`;
- practice mode vs interview mode inside `interviews`;
- candidate stats vs interview analytics.

The new product does not require those distinctions. A scenario is a **Practice**, regardless of whether its content happens to be an interview, sales call or customer-service simulation.

### Existing RLS

The migration set contains large policy files encoding ownership, candidate access, employer visibility, token ownership, template ownership and nested interview relationships. This is precisely the complexity we want to reduce in v2.

### v2 decision

Create a fresh schema. Do not replay the legacy migration history into the new project. Preserve the old database for reference/export only.

---

## 4. Practice/template creation

This is one of the most valuable existing areas.

### Existing implementation

`CreateCustomInterviewDialog.tsx` already provides a manual creator experience for:

- title;
- description;
- role;
- category;
- difficulty;
- evaluation criteria;
- questions and sample answers.

`custom-interview-builder.ts` creates criteria, a template, linking rows and questions. It also contains a quick-create path from a job description.

The quick-create UI is currently disabled/commented and the generation implementation is mainly keyword/rule matching rather than an LLM-generated editable draft.

The file itself documents an RLS problem around inserting `template_evaluation_criteria`, demonstrating how persistence policy has leaked into feature implementation.

### v2 decision

**MIGRATE THE PRODUCT IDEA, REWRITE THE IMPLEMENTATION.**

This becomes the central v2 feature:

```text
Describe what people should practise
             ↓
AI generates editable draft
             ↓
Scenario + Questions + Rubric
             ↓
Review
             ↓
Publish
```

The old builder is a reference for fields and UX, not source code to copy wholesale.

---

## 5. Session creation

`src/data/user/interviews.tsx` contains both the persistence layer and substantial session-domain logic.

Current `startInterviewAction`:

1. resolves logged-in user;
2. resolves candidate profile;
3. branches by `practice` vs `interview`;
4. copies template properties into `interviews`;
5. copies evaluation criteria;
6. selects/randomises questions;
7. persists `interview_questions`;
8. later reads/writes answers, evaluations and analytics.

### Good idea worth retaining

A session snapshots important template data at launch. That is exactly what v2 should do: editing a published practice in the future must not mutate historical participant results.

### Problems

- session cannot exist without a candidate profile;
- `practice` and `interview` have separate creation paths;
- Supabase calls and domain orchestration live together;
- random question selection is intertwined with persistence;
- data access functions, analytics functions and chat persistence share one large file.

### v2 decision

Replace with:

```text
practice.service.ts
session.service.ts

practice.repository.ts
session.repository.ts
```

A single `startSession(practiceId, participant)` use case should snapshot the published practice version into a session.

---

## 6. Learner/session UI

`InterviewFlow.tsx` is the most important proof that the core experience works, but it is also a strong example of why the new UI should not be copied verbatim.

It currently coordinates:

- initial session fetch;
- question fetch;
- current index;
- timer;
- camera state;
- answer state;
- database writes;
- practice/interview branching;
- per-question AI feedback;
- full-session AI evaluation;
- notifications;
- tutorial completion;
- routing;
- completion UI.

That produces a large client component with workflow state, I/O and presentation intertwined.

### v2 decision

**REWRITE.** Keep the visual/product lessons only.

Suggested split:

```text
PracticePlayer
  PracticeHeader
  ScenarioPanel
  QuestionPlayer
  Recorder
  FeedbackPanel
  SessionProgress
```

Use a small explicit session state model:

```text
loading
ready
listening
recording
transcribing
evaluating
feedback
complete
error
```

Do not let the React component directly know how the evaluation is persisted.

---

## 7. Voice, video and transcription

### UserCamera

Useful existing behavior:

- media permission handling;
- camera preview;
- microphone recording;
- recording duration;
- sound meter;
- fallback speech recognition;
- transcription callback.

### Browser FFmpeg

The current `MediaRecorderHandler` loads FFmpeg WASM from unpkg and converts browser-recorded WebM to WAV before sending it for transcription.

This adds substantial client weight and complexity.

### v2 decision

**MIGRATE:** MediaRecorder UX/permission knowledge.

**DO NOT MIGRATE BY DEFAULT:** FFmpeg conversion. Record a browser-supported audio type and submit it directly to the transcription endpoint. Add conversion only if actual target-browser testing proves it necessary.

### Video

Camera preview can be retained as an optional immersion feature, but the MVP does not need to upload or process video. Voice is the core input.

---

## 8. Text-to-speech

`textToSpeech.ts` successfully uses OpenAI speech generation and `AIQuestionSpeaker.tsx` plays each question with the Avery experience.

The current server function turns the entire audio response into a base64 data URL. This is simple but inefficient for larger payloads.

### v2 decision

**MIGRATE THE CAPABILITY.** Re-implement through a narrow TTS service and return/stream audio in a normal response rather than coupling the UI directly to an OpenAI helper.

Avery can remain a presentation/persona choice, but should not be a domain concept.

---

## 9. Per-response AI evaluation

`getQuestionFeedback.ts` proves the core rubric-based feedback loop.

Good existing ideas:

- explicit evaluation criteria and rubrics;
- structured fields: mark, summary, advice;
- low-temperature grading;
- Zod schema defined for feedback;
- actionable feedback rather than generic chat.

Problems:

- OpenAI client setup is repeated across files;
- prompts are manually assembled in multiple places;
- JSON is requested as text and then extracted from code fences/braces;
- retry implementations and direct-completion implementations coexist;
- dead/commented provider experiments remain;
- model names are scattered through code.

### v2 decision

**MIGRATE THE RUBRIC LOGIC, REWRITE THE IMPLEMENTATION.**

Use one AI boundary:

```text
src/modules/ai/
  client.ts
  models.ts

src/modules/evaluation/
  schemas.ts
  prompts.ts
  evaluate-response.ts
  evaluate-session.ts
```

Require schema-constrained structured output where supported, validate every response with Zod, and keep provider/model selection in configuration rather than feature files.

---

## 10. Final session evaluation

`getInterviewFeedback.ts` combines four responsibilities:

1. prompt construction;
2. model execution/parsing;
3. database insertion;
4. downstream candidate analytics and employer-facing summary generation.

This makes AI infrastructure capable of mutating unrelated product state.

### v2 decision

Separate it:

```text
evaluateSession(input) -> EvaluationResult

completeSessionService(...)
  -> validate session
  -> evaluate session
  -> persist evaluation
  -> mark complete
  -> enqueue/compute analytics
```

No AI helper should know about candidate profiles, Stripe, organisation pages or dashboard summaries.

---

## 11. Analytics

The legacy system has candidate skill stats, interview analytics, dashboard graphs and employer-facing candidate summaries. These are useful evidence that longitudinal measurement matters, but the data model is too candidate-specific.

### v2 MVP analytics

Only calculate what helps a creator answer:

- how many people completed this practice?
- what is the average overall score?
- which rubric criteria are weakest?
- is an individual improving across attempts?

More sophisticated cohort dashboards can follow real customer demand.

---

## 12. Employer marketplace

The existing application includes:

- employer-specific route tree;
- employee records;
- candidate search/visibility;
- candidate unlocks;
- token bundles;
- employer-facing candidate summaries;
- employer interests.

### v2 decision: FREEZE / DO NOT MIGRATE

The startup v2 should not make automated hiring selection its initial product. Organisation accounts are retained, but their purpose changes from recruiting marketplace to **practice creation and learner results**.

---

## 13. Sentiment model

The sentiment route sends text to an external Hugging Face endpoint and the candidate UI contains sentiment visualisation.

### v2 decision: FREEZE

Do not include sentiment/emotion classification in MVP grading. Rubric-based observable performance feedback is easier to explain and safer to position. The model repositories remain separate historical work.

---

## 14. Resume and job-tracker features

Candidate code handles resume upload/extraction, resume metadata, job tracking and subscription entitlements for those features.

### v2 decision: DELETE FROM MIGRATION SCOPE

They are not required for the practice platform loop. Interview-specific source material can later be attached to a practice through a generic `context`/resource feature if customers need it.

---

## 15. Billing

The current Stripe system mixes:

- candidate subscriptions;
- product catalogue rows;
- employer token bundles;
- candidate unlock payments;
- webhook-driven subscription sync;
- fallback Stripe-to-database auto-sync logic.

The Stripe client also pins an old API version.

### v2 decision

**REBUILD LATER, AFTER CORE MVP.**

The target billing model is much smaller:

```text
organization / creator plan
+ usage allowance
+ optional overage later
```

No unlock tokens. No candidate-side feature matrix in the first implementation.

---

## 16. Dependency audit

The legacy package manifest is much broader than the v2 feature set. Examples include:

- both `react-query` v3 and `@tanstack/react-query` v4;
- `react-router-dom` in a Next.js application;
- multiple chart libraries;
- multiple component ecosystems;
- browser FFmpeg;
- Hugging Face browser/server packages;
- face-api;
- Three.js;
- multiple mail providers;
- legacy auth-helper packages alongside `@supabase/ssr`.

### v2 rule

Start from an empty current-stable Next.js app and add a dependency only when a committed feature requires it.

Do not copy the legacy `package.json`.

---

## 17. Repository hygiene and build health

Observed signals:

- `.DS_Store` files are committed;
- a multi-megabyte generated `src/app/output.css` is committed;
- global `src/types.ts` contains unrelated concerns and mock fixture data;
- commented/dead code exists in critical paths;
- historical project guidance records periods where type/lint build checks were bypassed;
- current GitHub checks do run TypeScript and lint on PR/master, which is worth preserving as a principle.

### v2 rule

CI must block merge on:

```text
typecheck
lint
unit tests
critical Playwright smoke tests
build
```

Never use `ignoreBuildErrors` as a normal deployment mechanism.

---

## 18. KEEP / MIGRATE / REFACTOR / FREEZE / DELETE

| Area | Decision | Notes |
| --- | --- | --- |
| Supabase Auth concept | **MIGRATE** | Keep hosted identity; simplify wrappers |
| Supabase Postgres hosting | **MIGRATE** | Access through Drizzle in server code |
| Supabase Storage | **MIGRATE** | Only when files/audio/assets require it |
| Organisation + membership concept | **MIGRATE** | Becomes creator/team tenancy |
| Custom interview builder idea | **MIGRATE** | Rename/generalise to Practice Builder |
| Existing custom builder implementation | **REFACTOR/REWRITE** | Clean service/repository transaction |
| Questions | **MIGRATE** | Generic practice questions |
| Evaluation criteria/rubrics | **MIGRATE** | Collapse duplicate criteria models |
| Practice/interview templates | **REFACTOR** | One `practices` model |
| Interview session snapshot idea | **MIGRATE** | One generic session model |
| InterviewFlow component | **REWRITE** | Smaller state-driven learner experience |
| MediaRecorder behavior | **MIGRATE** | Simplified recorder module |
| Browser FFmpeg pipeline | **DELETE FROM MVP** | Add only if compatibility requires it |
| Whisper/transcription capability | **MIGRATE** | Central AI/audio service |
| TTS/Avery capability | **MIGRATE** | Clean TTS endpoint/service |
| Per-question rubric feedback | **MIGRATE** | Structured output + central prompt/schema |
| Final evaluation | **MIGRATE** | Separate AI from persistence/analytics |
| AI Coach | **FREEZE** | Revisit after creator/player loop |
| Candidate analytics | **REFACTOR** | Generic session/practice analytics only |
| Employer candidate search | **FREEZE** | Not v2 product |
| Candidate unlock tokens | **DELETE FROM MIGRATION** | Not v2 business model |
| Employer interests | **DELETE FROM MIGRATION** | Marketplace-specific |
| Resume parser/keyword analysis | **FREEZE** | Not core loop |
| Job application tracker | **DELETE FROM MIGRATION** | Not core loop |
| Sentiment model/UI | **FREEZE** | Not MVP evaluation signal |
| Course recommendations | **DELETE FROM MIGRATION** | Not core loop |
| Candidate B2C subscriptions | **FREEZE** | Replace with creator/org billing later |
| Stripe integration knowledge | **MIGRATE LATER** | New, smaller billing model |
| Playwright | **KEEP CONCEPT** | New tests for creator/player loop |
| GitHub CI | **KEEP CONCEPT** | Stronger v2 required checks |
| Legacy global `types.ts` | **DELETE FROM MIGRATION** | Domain-local schemas/types instead |
| Legacy migration history | **KEEP AS REFERENCE** | Do not replay into v2 DB |

---

## 19. Critical architectural principles for v2

1. **Practice, not Candidate, is the central aggregate.**
2. **Creator and participant are roles in workflows, not permanent mutually-exclusive user types.**
3. **One practice model, one session model, one evaluation model.**
4. **Historical sessions are immutable snapshots of the practice version used.**
5. **UI cannot query persistence directly.**
6. **OpenAI helpers return values; they do not mutate unrelated product state.**
7. **Supabase is infrastructure behind adapters.**
8. **Authorisation is explicit in server use cases, with simple RLS as defence in depth.**
9. **AI responses are schema-validated.**
10. **Do not add a feature unless it strengthens Create → Share → Practice → Feedback → Measure.**

---

## 20. Final audit recommendation

Do not spend a sprint cleaning every legacy file. The legacy repository is already valuable as a reference implementation. Cleaning features that will never migrate would create work with no startup value.

The next engineering action is to create a clean `interviewgrade-v2` repository and implement the target architecture in `ARCHITECTURE.md`, using the source-to-target plan in `MIGRATION_PLAN.md`.
