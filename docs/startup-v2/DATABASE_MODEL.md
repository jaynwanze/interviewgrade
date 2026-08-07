# InterviewGrade v2 Database Model

## 1. Goals

The v2 schema should represent the practice platform directly and remove the duplicated candidate/interview structure in the legacy database.

Design goals:

- one model for every type of practice;
- version published content so historical attempts remain explainable;
- support creators, teams and anonymous/invited participants;
- keep evaluation data structured enough for analytics;
- avoid premature tables for marketplace, LMS, SDK and advanced billing concerns;
- remain ordinary PostgreSQL so hosting can move without rewriting the product.

---

## 2. Core relationship map

```text
auth.users
    │
    └── profiles
          │
          ├── organization_members ── organizations
          │                              │
          │                              └── practices
          │                                    │
          │                                    └── practice_versions
          │                                          ├── practice_questions
          │                                          └── rubric_criteria
          │
          └──────────────────────────── sessions
                                             │
                                             ├── session_responses
                                             │       └── response_evaluations
                                             │
                                             └── session_evaluations
```

A session references an immutable `practice_version`.

---

## 3. Profiles

Supabase Auth remains the identity provider initially. Application profile data should stay small.

```ts
profiles
- id uuid primary key             // same ID as auth.users.id
- display_name text null
- avatar_url text null
- created_at timestamptz not null
- updated_at timestamptz not null
```

Do **not** add `user_type = candidate | employer`.

Creator/participant behavior is inferred from relationships and actions.

---

## 4. Organizations

Every practice belongs to an organisation. A solo user may receive a personal organisation automatically.

```ts
organizations
- id uuid primary key
- name text not null
- slug text unique null
- created_by uuid not null -> profiles.id
- created_at timestamptz not null
- updated_at timestamptz not null
```

### Organization members

```ts
organization_members
- organization_id uuid not null -> organizations.id on delete cascade
- user_id uuid not null -> profiles.id on delete cascade
- role text not null             // owner | admin | member
- created_at timestamptz not null

primary key (organization_id, user_id)
```

Start with only three roles.

---

## 5. Practices

`practices` is the stable identity and authoring container.

```ts
practices
- id uuid primary key
- organization_id uuid not null -> organizations.id
- created_by uuid not null -> profiles.id
- title text not null
- description text null
- status text not null            // draft | published | archived
- share_slug text unique null
- current_draft_version_id uuid null
- current_published_version_id uuid null
- created_at timestamptz not null
- updated_at timestamptz not null
```

Version foreign keys can be added after `practice_versions` is created.

Why separate stable practice from versioned content?

- title/list identity can survive content edits;
- publishing can create an immutable version;
- old sessions remain tied to the exact questions/rubric used;
- future A/B/version reporting becomes possible without redesign.

---

## 6. Practice versions

```ts
practice_versions
- id uuid primary key
- practice_id uuid not null -> practices.id on delete cascade
- version integer not null
- state text not null              // draft | published
- scenario text not null
- instructions text null
- difficulty text null
- estimated_duration_minutes integer null
- generation_metadata jsonb null   // optional provenance, not product truth
- created_by uuid not null -> profiles.id
- created_at timestamptz not null
- published_at timestamptz null

unique (practice_id, version)
```

A published version is immutable at the application layer.

`generation_metadata` may contain things like generation model/schema version, but should not contain secrets.

---

## 7. Practice questions

```ts
practice_questions
- id uuid primary key
- practice_version_id uuid not null -> practice_versions.id on delete cascade
- position integer not null
- prompt text not null
- guidance text null
- sample_answer text null
- max_response_seconds integer null
- created_at timestamptz not null

unique (practice_version_id, position)
```

Question `type` is deliberately not a required enum in the first schema. Interview-specific values such as Behavioral/Situational should not constrain sales or training scenarios. If categorisation proves useful, add a flexible `kind` later.

---

## 8. Rubric criteria

```ts
rubric_criteria
- id uuid primary key
- practice_version_id uuid not null -> practice_versions.id on delete cascade
- name text not null
- description text not null
- weight numeric(5,2) not null
- position integer not null
- rubric_levels jsonb not null
- created_at timestamptz not null
```

Example `rubric_levels`:

```json
[
  {
    "label": "Strong",
    "minScore": 80,
    "maxScore": 100,
    "description": "Clear, specific and persuasive response with evidence."
  },
  {
    "label": "Developing",
    "minScore": 50,
    "maxScore": 79,
    "description": "Relevant response but missing specificity or structure."
  },
  {
    "label": "Needs work",
    "minScore": 0,
    "maxScore": 49,
    "description": "Response does not sufficiently demonstrate the criterion."
  }
]
```

### Weight constraint

Application validation should require weights across a published version to total 100 (or 1.0 if decimal weights are preferred). PostgreSQL cannot conveniently enforce an aggregate sum with a simple CHECK constraint, so validate transactionally during publish.

---

## 9. Question-to-criterion mapping

A question may assess one or several criteria. Do not duplicate a whole criterion JSON object into the question row as the legacy system does.

```ts
question_rubric_criteria
- question_id uuid not null -> practice_questions.id on delete cascade
- rubric_criterion_id uuid not null -> rubric_criteria.id on delete cascade

primary key (question_id, rubric_criterion_id)
```

This keeps the relationship normalized while the published version itself remains immutable.

---

## 10. Sessions

```ts
sessions
- id uuid primary key
- practice_id uuid not null -> practices.id
- practice_version_id uuid not null -> practice_versions.id
- participant_user_id uuid null -> profiles.id
- participant_name text null
- participant_email text null
- status text not null               // created | in_progress | completed | abandoned
- current_question_position integer not null default 0
- started_at timestamptz null
- completed_at timestamptz null
- created_at timestamptz not null
- metadata jsonb null
```

Important rules:

- `practice_version_id` must identify a published version when the session starts;
- a session cannot silently switch versions;
- anonymous participant fields are optional;
- avoid copying all practice content into `sessions` because immutable version rows already provide the snapshot.

For ultra-portable archival later, a JSON snapshot may be added deliberately, but it is not needed initially.

---

## 11. Session responses

```ts
session_responses
- id uuid primary key
- session_id uuid not null -> sessions.id on delete cascade
- question_id uuid not null -> practice_questions.id
- transcript text not null
- audio_object_path text null
- duration_seconds integer null
- attempt_number integer not null default 1
- submitted_at timestamptz not null
- created_at timestamptz not null

unique (session_id, question_id, attempt_number)
```

### Retry semantics

Do not overwrite the first response when the participant clicks **Try Again**. Add a new attempt number. This lets the product later show improvement within one session.

The session service decides which attempt counts as the current/final response.

---

## 12. Response evaluations

```ts
response_evaluations
- id uuid primary key
- response_id uuid not null -> session_responses.id on delete cascade
- score numeric(5,2) not null
- criterion_scores jsonb not null
- summary text not null
- strengths jsonb not null
- improvements jsonb not null
- next_step text null
- schema_version text not null
- model text null
- created_at timestamptz not null

unique (response_id, schema_version)
```

Example `criterion_scores`:

```json
[
  {
    "criterionId": "...",
    "score": 82,
    "evidence": "The response acknowledged the concern and reframed value."
  }
]
```

Use IDs from the immutable practice version so evaluations remain traceable to exact rubric definitions.

---

## 13. Session evaluations

```ts
session_evaluations
- id uuid primary key
- session_id uuid not null -> sessions.id on delete cascade
- overall_score numeric(5,2) not null
- criterion_scores jsonb not null
- strengths jsonb not null
- improvements jsonb not null
- recommendations jsonb not null
- summary text null
- schema_version text not null
- model text null
- created_at timestamptz not null

unique (session_id, schema_version)
```

### Deterministic score calculation

The model should not be trusted to add scores correctly. Calculate weighted scores in TypeScript from validated response/criterion scores, then ask AI to generate qualitative synthesis where useful.

---

## 14. Optional invitations — post-first-MVP

Only add when a pilot needs assigned learners rather than open share links.

```ts
practice_invitations
- id uuid primary key
- practice_id uuid not null
- email text not null
- invited_by uuid not null
- status text not null          // pending | accepted | expired
- token_hash text not null
- expires_at timestamptz not null
- created_at timestamptz not null
```

Do not block the first share-link MVP on invitation workflows.

---

## 15. Billing tables — later

Do not recreate the legacy `products`, `tokens`, candidate subscriptions and candidate unlocks.

When billing is introduced, start with:

```ts
billing_customers
- organization_id uuid primary key
- stripe_customer_id text unique not null

subscriptions
- id uuid primary key
- organization_id uuid not null
- stripe_subscription_id text unique not null
- stripe_price_id text not null
- status text not null
- current_period_start timestamptz null
- current_period_end timestamptz null
- cancel_at_period_end boolean not null default false
- updated_at timestamptz not null
```

Usage can initially be queried from completed sessions. Add metering tables only after actual billing needs justify them.

---

## 16. Tables intentionally not recreated

The v2 initial schema does not include legacy equivalents for:

```text
candidates
employees
employee_candidate_unlocks
tokens
job_application_tracker
interview_templates
interview_evaluation_criteria
interview_template_interview_evaluation_criteria
candidate skill-stat JSON blobs
employer candidate preferences
```

Their absence is intentional.

---

## 17. Suggested Drizzle schema grouping

```text
src/db/schema/
  profiles.ts
  organizations.ts
  practices.ts
  sessions.ts
  evaluations.ts
  index.ts
```

Avoid one giant schema file.

---

## 18. Indexes

At minimum:

```text
organizations.slug                       UNIQUE
practices.share_slug                     UNIQUE
practices.organization_id               INDEX
practice_versions.practice_id            INDEX
practice_questions.practice_version_id   INDEX
rubric_criteria.practice_version_id      INDEX
sessions.practice_id                     INDEX
sessions.practice_version_id             INDEX
sessions.participant_user_id             INDEX
sessions.created_at                      INDEX
session_responses.session_id             INDEX
response_evaluations.response_id         INDEX
session_evaluations.session_id           INDEX
```

Add composite indexes based on real query plans rather than guessing every future dashboard query.

---

## 19. IDs and timestamps

Use UUIDs generated by application code or PostgreSQL consistently. Do not mix bigint identities and UUIDs without a reason.

Recommended standard columns:

```text
id uuid
created_at timestamptz
updated_at timestamptz where mutable
```

Use UTC timestamps.

---

## 20. Deletion behavior

Institutional customers will eventually care about retention and deletion.

MVP defaults:

- deleting a draft practice may cascade its unpublished versions;
- published practices with historical sessions should be archived rather than hard-deleted from normal UI;
- deleting an account should define what happens to organisation-owned content before production pilots;
- participant data should be deletable without corrupting aggregate practice records;
- raw audio, if stored, needs explicit deletion behavior.

---

## 21. RLS strategy

Because normal persistence goes through server-side Drizzle, RLS does not need to encode every application action.

Recommended principle:

- browser does not directly read/write core tables;
- server authenticates the user and performs explicit authorization;
- core organization-owned tables may still use straightforward RLS/tenant protection as defence in depth where practical;
- service-role credentials remain server-only.

This keeps authorization readable and testable in application code while retaining database safety.

---

## 22. Migration from legacy data

Do **not** attempt an automatic one-to-one migration of the entire legacy schema.

If preserving real user/session data becomes necessary, write explicit one-off migration scripts after v2 tables exist:

```text
legacy templates + evaluation criteria + questions
        → practice + published practice_version

legacy interviews + interview_questions + answers
        → sessions + session_responses

legacy interview_evaluations
        → session_evaluations
```

Marketplace-specific records are left behind unless a concrete business need emerges.

The first v2 development environment should start from clean seed data rather than transformed legacy production data.
