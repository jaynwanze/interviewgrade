# InterviewGrade v2 Architecture

## 1. Architecture goal

Build the smallest system that can reliably support this loop:

```text
Creator describes a skill/scenario
              ↓
Create / generate a Practice
              ↓
Review scenario + questions + rubric
              ↓
Publish
              ↓
Share URL
              ↓
Participant completes voice practice
              ↓
Transcribe + evaluate responses
              ↓
Participant sees actionable feedback
              ↓
Creator sees results and improvement
```

Interview preparation is content inside this platform, not a separate technical architecture.

---

## 2. System boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│                         Next.js app                         │
│                                                             │
│  Marketing      Creator UI        Practice Player           │
│      │               │                   │                  │
│      └───────────────┴───────────────────┘                  │
│                          │                                  │
│                  Application services                       │
│                          │                                  │
│       ┌──────────────────┼──────────────────┐               │
│       │                  │                  │               │
│   Practice           Session           Evaluation           │
│   module             module            module               │
│       │                  │                  │               │
│       └──────────────────┴──────────────────┘               │
│                          │                                  │
│                    Repositories                             │
│                          │                                  │
│                       Drizzle                               │
└──────────────────────────┼──────────────────────────────────┘
                           │
                       PostgreSQL
                  (hosted by Supabase)

External adapters:
Supabase Auth ─────── identity
Supabase Storage ─── assets when required
OpenAI ───────────── generation / speech / transcription / evaluation
Stripe ───────────── creator/org billing (post-core MVP)
```

---

## 3. Dependency direction

The most important rule is dependency direction.

```text
UI
 ↓
Server Action / Route Handler
 ↓
Application Service
 ↓
Repository Interface / Repository
 ↓
Drizzle
 ↓
PostgreSQL
```

External AI/storage/billing services follow the same pattern:

```text
Application Service
 ↓
Port / service interface
 ↓
OpenAI / Supabase Storage / Stripe adapter
```

A React component should never need to know whether rows are stored in Supabase, Neon or RDS.

---

## 4. Proposed repository layout

```text
src/
  app/
    (marketing)/
      page.tsx
      pricing/

    (auth)/
      login/
      signup/
      callback/

    (creator)/
      dashboard/
      practices/
        page.tsx
        new/
        [practiceId]/
          page.tsx
          edit/
          results/

    p/
      [slug]/
        page.tsx

    session/
      [sessionId]/
        page.tsx

    api/
      audio/
        transcribe/
        speech/
      practices/
        generate/
      evaluations/
        response/
      stripe/
        webhook/

  modules/
    auth/
      require-user.ts
      require-org-member.ts
      types.ts

    organization/
      organization.schema.ts
      organization.repository.ts
      organization.service.ts

    practice/
      practice.schema.ts
      practice.repository.ts
      practice.service.ts
      practice-version.service.ts
      practice-generation.service.ts

    session/
      session.schema.ts
      session.repository.ts
      session.service.ts
      session-state.ts

    evaluation/
      evaluation.schema.ts
      evaluation.repository.ts
      evaluation.service.ts
      prompts.ts

    audio/
      transcription.service.ts
      speech.service.ts
      recorder.types.ts

    analytics/
      analytics.repository.ts
      analytics.service.ts

    billing/                  # add after core MVP
      billing.service.ts
      stripe.adapter.ts

  db/
    client.ts
    schema/
      users.ts
      organizations.ts
      practices.ts
      sessions.ts
      evaluations.ts
    migrations/

  lib/
    env.ts
    errors.ts
    ids.ts

  integrations/
    openai/
      client.ts
      models.ts
    supabase/
      auth-server.ts
      auth-browser.ts
      storage.ts

  components/
    ui/
    creator/
    practice-player/
```

No giant global `types.ts`. Types should live beside the domain they describe.

---

## 5. Domain model

### User

A person with an identity. Do not permanently classify a user as candidate vs employer.

A user may:

- create practices;
- belong to organisations;
- participate in practices;
- do all three.

### Organization

A tenant/team that owns practices and results.

A solo creator can have an automatically created personal organisation if that simplifies tenancy.

### Practice

The authoring aggregate.

Contains product-level fields such as:

- title;
- description;
- scenario;
- instructions;
- difficulty;
- estimated duration;
- status;
- share slug;
- owner organisation.

Questions and rubric criteria belong to a **practice version**, not directly to an eternally mutable practice record.

### PracticeVersion

Immutable published content snapshot.

A draft can change freely. Publishing creates a version. Sessions reference a specific published version.

This solves a critical historical-data problem:

> If a creator changes a rubric tomorrow, a learner's result from yesterday must still be explainable using yesterday's rubric.

### Session

A participant's attempt against one practice version.

Tracks lifecycle only:

```text
created → in_progress → completed
                    ↘ abandoned
```

### SessionResponse

One participant answer to one versioned question.

Stores transcript plus minimal audio metadata/reference if audio retention is enabled.

### Evaluation

Structured result for either a response or a session.

Contains:

- overall score;
- criterion scores;
- strengths;
- improvements;
- actionable recommendation;
- evaluation schema version;
- model metadata for observability.

---

## 6. Creator workflow

### Create manually

```text
New Practice
  ↓
Title + scenario
  ↓
Questions
  ↓
Rubric criteria + weights/descriptors
  ↓
Preview
  ↓
Publish
```

### Generate with AI

The highest-leverage creator workflow:

```text
"Junior SaaS sales reps handling price objections"
                         ↓
              PracticeGenerationService
                         ↓
       validated PracticeDraftSchema
                         ↓
                  editable form
                         ↓
                       publish
```

AI generation never publishes directly. The creator reviews the generated draft.

### Share

Publishing produces:

```text
https://interviewgrade.io/p/<slug>
```

The first distribution mechanism is a URL. An iframe embed follows once the hosted player is stable.

---

## 7. Participant workflow

A participant should not have to navigate the creator application.

```text
/p/<slug>
   ↓
Practice landing / scenario
   ↓
Start
   ↓
/session/<id>
   ↓
Question
   ↓
Record
   ↓
Transcribe
   ↓
Evaluate
   ↓
Feedback
   ↓
Next
   ↓
Final result
```

Authentication should not be required for the first public-share MVP unless abuse/security constraints force it. A session can support:

- authenticated participant;
- invited participant;
- anonymous participant with display name/email collected optionally.

Creator ownership and result visibility remain server-enforced.

---

## 8. Practice player state

Do not recreate the legacy `InterviewFlow` as one large client component.

Use a small state machine/reducer:

```text
loading
  ↓
ready
  ↓
recording
  ↓
transcribing
  ↓
evaluating
  ↓
feedback
  ├── retry → recording
  └── next  → ready
               ↓
             complete
```

Error substates should permit retry without losing completed responses.

The browser owns temporary recording state. The server owns authoritative session state.

---

## 9. API / server boundary

Prefer Server Actions for authenticated creator form mutations where they make the UI simpler.

Prefer Route Handlers for boundaries that naturally behave like APIs or deal with streaming/binary requests:

- audio transcription;
- TTS audio;
- public session response submission;
- webhook endpoints;
- future embeds/API clients.

Do not create internal HTTP calls when a server-side function call is enough.

---

## 10. Database access

### Drizzle owns application persistence

Example desired usage:

```ts
const practice = await practiceRepository.getById(practiceId);
```

not:

```ts
const supabase = createClient();
await supabase.from('practices').select('*');
```

throughout feature code.

### Supabase client usage is restricted to

- Auth;
- Storage;
- rare infrastructure-specific features that are intentionally adopted.

Do not use Supabase PostgREST as the default application query layer in v2.

---

## 11. Transactions

Practice creation/publishing and session completion are multi-write operations and must be atomic where consistency matters.

Examples:

### Publishing

```text
validate draft
begin transaction
  create practice_version
  copy questions
  copy rubric criteria
  set practice.current_published_version_id
  set status = published
commit
```

### Completing a session

Evaluation calls cannot be held inside a long database transaction. Instead:

```text
validate responses
 ↓
run AI evaluation
 ↓
begin short transaction
  persist evaluation
  mark session completed
commit
```

Use idempotency so a retry cannot create duplicate final evaluations.

---

## 12. AI architecture

All provider calls go through one integration boundary.

```text
integrations/openai/client.ts
```

Feature modules own prompts and schemas because prompts are business behavior, not generic provider behavior.

### Practice generation

Input:

```ts
{
  objective: string;
  audience?: string;
  difficulty?: string;
  questionCount?: number;
}
```

Output must validate against a schema equivalent to:

```ts
PracticeDraft {
  title
  description
  scenario
  questions[]
  rubricCriteria[]
}
```

### Response evaluation

Input contains only the information needed to grade the response:

- scenario;
- question;
- transcript;
- applicable criterion/rubric;
- optional context.

Output is structured and Zod-validated.

### Session evaluation

Aggregate response results into an explainable final summary. Do not ask the model to invent arithmetic that can be computed deterministically in code.

For example, criterion weighted averages and total scores should be calculated by application code; AI generates qualitative feedback around those values.

### Model configuration

Model IDs live in one config module/environment mapping so changing a model does not require editing prompt files.

---

## 13. Audio architecture

### MVP recording

Use browser `MediaRecorder`.

Keep the raw recording format supported by the browser and send that file directly to the server transcription endpoint if the provider supports it.

Avoid browser FFmpeg by default.

### Retention

Default MVP behavior should avoid storing raw audio unless it creates concrete customer value. A transcript plus result is enough for the core loop and reduces storage/privacy burden.

If audio is retained later, define an explicit retention policy and store through a storage adapter.

### TTS

Question speech goes through a server endpoint/service. Cache generated speech by `(practiceVersionQuestionId, voice, model)` where worthwhile; do not regenerate identical published questions for every participant indefinitely.

---

## 14. Authentication and tenancy

### Auth

Supabase Auth remains the identity provider initially.

Keep two helpers:

```ts
requireUser()
getOptionalUser()
```

Avoid five context-specific Supabase client abstractions unless the framework truly requires them.

### Organization authorization

Application-level authorization should be explicit:

```ts
await requireOrganizationRole({
  userId,
  organizationId,
  minimumRole: 'member',
});
```

Suggested roles for MVP:

```text
owner
admin
member
```

Do not add granular permission matrices until demanded.

### RLS

Use straightforward tenant isolation policies for defence in depth, especially on organization-owned rows. Do not encode the entire product workflow into RLS.

---

## 15. Analytics architecture

Do not maintain large denormalized candidate JSON skill stats as a primary source of truth.

Source analytics from sessions/evaluations and add aggregates only when performance proves necessary.

MVP queries:

```text
practice completion count
average overall score
average criterion score
participant attempt history
first vs latest score
```

---

## 16. Billing architecture

Billing is intentionally outside the first core implementation.

When added:

```text
Organization
  ↓
BillingCustomer
  ↓
Subscription
  ↓
Entitlement / Usage
```

Stripe is the payment source of truth; the database stores the product state required to authorize usage.

Avoid the legacy combination of candidate subscriptions + employer token bundles + candidate unlocks.

---

## 17. Embedding roadmap

Do not build an SDK before proving distribution demand.

Order:

1. hosted share URL;
2. iframe embed;
3. completion webhook;
4. session-creation REST API;
5. React SDK only if usage justifies it.

The hosted player should therefore be built with an embed-friendly shell from the beginning: no creator navigation, predictable height/responsiveness, and explicit origin/embedding policy.

---

## 18. Observability

For every AI call record safe operational metadata:

- feature (`practice_generation`, `response_evaluation`, etc.);
- model;
- latency;
- success/failure;
- token/usage counts where available;
- schema version;
- session/practice IDs for internal tracing;
- no secret keys and no unnecessary personal data in logs.

Do not log full transcripts/prompts by default in production.

---

## 19. Error handling

Use typed/domain errors rather than scattering `throw new Error()` strings.

Examples:

```text
AuthenticationRequiredError
ForbiddenError
PracticeNotFoundError
PracticeNotPublishedError
SessionAlreadyCompletedError
TranscriptionError
EvaluationError
```

Convert these to user-safe messages at the boundary.

---

## 20. Testing strategy

### Unit

Test deterministic business logic:

- score calculation;
- rubric weighting;
- session transitions;
- practice validation;
- entitlement/usage logic later.

### Integration

Test repositories against a test Postgres database.

### Contract

Mock provider responses and verify every AI schema parser.

### E2E

The required v2 smoke path is:

```text
creator signup/login
→ create practice
→ publish
→ open share URL
→ start session
→ submit answer
→ receive feedback
→ complete
→ creator views result
```

No release is considered healthy if this flow fails.

---

## 21. Security/privacy defaults

- secrets are server-only;
- no service-role key in browser bundles;
- validate all IDs and payloads;
- verify organization ownership server-side;
- public practice sessions use unguessable IDs and rate limits;
- webhook signatures are verified;
- avoid storing raw audio by default;
- add deletion/retention behavior before institutional pilots;
- AI feedback is coaching support, not a definitive employability or personality judgment.

---

## 22. Architecture decision summary

| Decision | v2 choice |
| --- | --- |
| Primary domain | Practice / Session / Evaluation |
| Permanent candidate/employer split | No |
| Framework migration | New current-stable Next.js repo |
| Database | PostgreSQL |
| Query/migrations | Drizzle |
| Database hosting | Supabase initially |
| Auth | Supabase Auth initially |
| Storage | Supabase Storage when needed |
| Direct PostgREST feature queries | No by default |
| AI boundary | Central OpenAI adapter + domain prompts/schemas |
| Audio conversion | No FFmpeg unless proven necessary |
| Session history | Immutable versioned practice snapshot |
| First distribution | Hosted share link |
| First integration | iframe after hosted player works |
| Billing | Creator/org subscription after core MVP |
