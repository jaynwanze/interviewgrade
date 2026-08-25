# AI Coach and Practice Context

This document scopes two future V2 capabilities that fit the current InterviewGrade architecture without reviving the old V1 side-products:

1. **AI Coach grounded in completed Practice responses/reports**;
2. **job-description / résumé context used to generate better Practices**.

The goal is to extend the existing loop:

**Create a Practice → complete it → get rubric feedback/report → improve**

rather than create a separate chatbot or résumé-scoring product.

---

## 1. Product decisions

### AI Coach

AI Coach is a **contextual follow-up to existing feedback**, not a generic assistant.

Good examples:

- “Why did I score 62 on stakeholder communication?”
- “How could I structure this answer better?”
- “Rewrite my answer using STAR without inventing experience.”
- “What should I practise next based on this report?”
- “Give me a stronger answer outline for Question 3.”

The Coach must stay grounded in the user’s persisted Practice data and must not pretend to know facts that are not present in the response/report.

### Practice context from job descriptions / résumés

Résumé and job-description handling is a **Practice-generation input**, not a standalone résumé-analysis product.

Good examples:

- upload a job description and generate a Practice around the role’s real requirements;
- upload a résumé and generate behavioural questions around experience actually present in it;
- combine a job description + résumé to practise likely gaps, relevant stories and role-specific questions;
- paste context manually when a file is unnecessary.

InterviewGrade should not assign an “employability score”, rank a résumé, or claim whether a person will be hired.

---

## 2. Fit with the current V2 architecture

Neither feature needs a parallel architecture.

```text
Practice generation context
        ↓
PracticeGenerationService
        ↓
validated editable PracticeDraft
        ↓
Practice / PracticeVersion

Completed Practice Session
        ↓
SessionResponse + persisted Evaluation
        ↓
AI Coach service
        ↓
grounded coaching answer
```

Existing architectural rules continue to apply:

- UI → server boundary → application service → repository/integration;
- provider calls stay behind the existing OpenAI integration boundary;
- prompts/schemas live with the feature module that owns the business behaviour;
- server authorization owns access to sessions/reports;
- browser roles never gain direct write access to protected evaluation state;
- do not log full transcripts, résumé text or job descriptions by default.

---

# Part A — AI Coach

## 3. MVP user experience

### Entry points

The first version should appear only where useful context already exists:

- final Practice report;
- response-review section inside a report;
- optionally History when opening a completed report.

Avoid a global “AI Coach” navigation item in the first version. A blank chatbot creates unclear expectations and weak grounding.

### Suggested UI

On a final report:

**Ask about your feedback**

Suggested prompts:

- Why did I get this score?
- How can I improve this answer?
- Show me a stronger structure.
- What should I practise next?

A user can also type a short custom question.

For a specific response, the Coach is scoped to that response by default. From the overall report, it can use the full session report.

---

## 4. Grounding contract

The Coach request must resolve its own trusted context server-side. The client should provide identifiers, not authoritative report text.

Example request boundary:

```ts
{
  sessionId: string;
  responseId?: string;
  question: string;
}
```

The server resolves an allowed grounding packet such as:

```ts
CoachGroundingContext {
  practiceTitle
  scenario
  question?: {
    text
    rubricCriteria
  }
  response?: {
    transcript
    evaluation
  }
  sessionEvaluation?: {
    overallScore
    criterionScores
    strengths
    improvements
    recommendations
  }
}
```

Do not send unrelated account/profile data to the model.

Do not send raw audio/video.

---

## 5. Authorization

The first Coach release should require a signed-in user and use the same session/report access boundary already used by V2 report/feedback routes.

Rules:

- user may coach against their own completed/self-Practice result;
- a Practice owner viewing participant results must **not automatically gain a private coaching conversation on behalf of that participant**;
- guest-session Coach access is deferred for the first slice because durable identity, abuse controls and private follow-up ownership are less clear;
- direct IDs must always be authorized server-side to prevent IDOR.

---

## 6. Model behaviour

The system prompt should require the Coach to:

- ground claims in the provided transcript/rubric/evaluation;
- distinguish “your response said…” from general interview guidance;
- never invent personal experience for the user;
- when rewriting an answer, use placeholders or only facts present in the transcript/context;
- explain rubric feedback rather than silently rescore it;
- keep the creator-defined rubric score authoritative;
- avoid personality, emotion, confidence, honesty or employability inference;
- not provide hiring/ranking recommendations about a person.

The Coach may suggest a better structure or example phrasing, but **does not mutate the persisted Evaluation**.

---

## 7. Application boundary

Recommended module shape:

```text
src/modules/coaching/
  coach.service.ts
  coach.schema.ts
  coach.prompts.ts
  coach.types.ts
```

Possible route:

```text
POST /api/v2/practice-coach
```

Flow:

```text
request
  ↓
authenticate
  ↓
authorize session/response access
  ↓
load trusted PracticeVersion + transcript + Evaluation
  ↓
validate user question length/content
  ↓
reserve Coach usage
  ↓
OpenAI adapter
  ↓
validate response
  ↓
return grounded answer
```

Prefer streaming only if it materially improves perceived latency. The first implementation can be non-streaming if that keeps the failure/retry path simpler.

---

## 8. Persistence strategy

### Phase A1 — recommended first slice

**No new chat tables.**

Treat each Coach question as a single grounded request. Suggested prompts cover most first-use cases and keep privacy/cost/state simple.

This means the first slice can potentially ship without a database migration if usage can be reserved through an existing/general AI usage mechanism, or with only a small dedicated usage ledger if required.

### Phase A2 — only if multi-turn usage proves valuable

Add explicit thread persistence:

```text
coach_threads
- id
- user_id
- session_id
- response_id nullable
- created_at
- updated_at

coach_messages
- id
- thread_id
- role
- content
- created_at
- model metadata / usage metadata as needed
```

RLS/server ownership must keep threads private to the user who created them.

Do not overload `evaluations` or `session_responses` with chat messages.

---

## 9. Cost and abuse controls

AI Coach introduces open-ended model usage, so it must have a separate explicit budget.

First release should include:

- authenticated-only access;
- short maximum user-question length;
- bounded grounding/context size;
- server-side usage reservation before provider call;
- per-user/monthly allowance or a deliberately small per-session allowance;
- rate limit for burst abuse;
- idempotency/retry handling where practical;
- provider timeout and user-safe failure state.

Do **not** advertise “unlimited AI Coach”.

Exact Free/Pro Coach allowances should be chosen after measuring prompt size and cost. They should not silently reuse the 30 Practice-run allowance because the cost unit is different.

---

## 10. AI Coach acceptance criteria

The first useful slice is complete when:

- a signed-in participant can ask a question from a completed report;
- a response-level question is grounded only in that response + applicable rubric/evaluation;
- an overall-report question uses the persisted session evaluation;
- the Coach cannot modify scores/evaluations;
- another user cannot access the session by guessing IDs;
- no raw audio/video is sent;
- repeated/burst use is cost-controlled;
- failure does not affect report/history state;
- automated tests cover authorization and grounding assembly;
- provider calls are mocked in CI.

---

# Part B — Job-description / résumé Practice context

## 11. Product experience

This belongs inside **Create a Practice**.

Do not add a separate “Résumé Analysis” product area for the first version.

A future Create flow can expose:

```text
Create with AI
  - describe what you want to practise

Create from context
  - Job description
  - Résumé/CV
  - Job description + Résumé/CV
  - Other source document

Build manually
```

The generated result always remains the same editable V2 Practice draft.

---

## 12. Reuse the existing document pipeline

InterviewGrade already supports text-based PDF/TXT extraction for Practice generation and intentionally does not store the uploaded source file in that flow.

The first context slice should reuse that boundary rather than create a résumé-specific ingestion service.

```text
file / pasted text
    ↓
validate type + size
    ↓
extract text server-side
    ↓
classify source intent from explicit user choice
    ↓
assemble Practice generation context
    ↓
PracticeGenerationService
    ↓
validated editable PracticeDraft
    ↓
discard source text after request
```

This keeps the privacy model simple and avoids building a document library before there is demand.

---

## 13. Context types

Use explicit user intent rather than trying to infer everything from a file.

Suggested values:

```ts
type PracticeContextKind =
  | 'job-description'
  | 'resume'
  | 'job-description-and-resume'
  | 'other';
```

Generation behaviour:

### Job description

Extract and prioritize:

- role responsibilities;
- required/desired skills;
- recurring competencies;
- domain/context;
- seniority clues;
- interview-relevant scenarios.

### Résumé/CV

Use only facts present in the source to:

- identify experiences that could support behavioural questions;
- create prompts that help the user practise explaining those experiences;
- tailor likely follow-ups to role history/skills.

Do not fabricate achievements or convert résumé content into an employability score.

### Job description + résumé

Use the job description to define the target and the résumé to personalize practice examples.

Useful output includes:

- role-specific questions;
- behavioural prompts tied to actual experience;
- questions around relevant gaps without claiming the gap makes the person unsuitable;
- rubric criteria relevant to the target role.

---

## 14. Prompt/data boundary

Recommended Practice generation input extension:

```ts
PracticeGenerationInput {
  objective: string
  questionCount: number
  targetRole?: string
  experienceLevel?: string
  interviewFocus?: string
  context?: {
    kind: PracticeContextKind
    jobDescriptionText?: string
    resumeText?: string
    otherSourceText?: string
  }
}
```

`context` is request-scoped in the first implementation.

The generator still returns the same validated `PracticeDraft` schema. Context must not create a second Practice type.

---

## 15. Privacy and retention

First release defaults:

- source file validated server-side;
- raw file not persisted;
- extracted résumé/job-description text not persisted after the generation request;
- local filename not retained unless explicitly needed for transient UI;
- no document text in normal production logs;
- no employer access to a user’s résumé context simply because they own a shared Practice;
- generated Practice content is user-reviewable before publish.

If saved reusable context is added later, it needs explicit user controls for view/delete/retention and a separate server-owned data model.

---

## 16. Persistence strategy

### Phase B1 — recommended first slice

No schema change required if the current document generation flow can accept an explicit context type and, where supported, two transient sources.

Possible incremental implementation:

1. rename/generalize the current document UI from a single “source document” mental model to “Practice context”;
2. allow user to choose job description / résumé / other;
3. pass that explicit kind into Practice generation;
4. tune generation prompts for each kind;
5. optionally support two inputs for job-description + résumé once the single-context path is stable.

### Phase B2 — only if reuse is valuable

Add a private saved-context model, for example:

```text
practice_context_sources
- id
- owner_user_id
- kind
- display_name
- extracted_text or storage reference (only if retention is justified)
- created_at
- deleted_at
```

This requires clear retention/deletion UX and should not be built merely for convenience.

---

## 17. Entitlements and cost

Context-enhanced Practice generation should consume the **existing AI-created Practice allowance**, because it results in the same product action: one AI-created Practice draft.

Do not introduce a second paid “résumé analysis credit” for the first version.

Potential extra provider/parser costs must still be bounded with:

- existing upload size/type limits;
- extracted-text length limit;
- explicit no-silent-truncation behaviour;
- one generation reservation per submitted creation request;
- idempotency protections already used by AI Practice creation where applicable.

---

## 18. Practice-context acceptance criteria

The first useful slice is complete when:

- a user can explicitly mark uploaded/pasted context as a job description or résumé;
- generated questions/rubric reflect that context;
- résumé-derived output uses only source-supported personal facts;
- the output is still a normal editable Practice draft;
- uploaded source and extracted text are not persisted by default;
- context generation uses the existing AI-created Practice entitlement;
- malformed/oversized/unsupported documents fail before provider spend where possible;
- tests cover input validation and prompt assembly;
- provider responses remain schema-validated.

---

# Part C — Delivery sequence

## 19. Recommended order

### Phase 1 — AI Coach proof of value

Small report-grounded single-turn Coach:

- report entry point;
- suggested questions + custom question;
- server-side grounding;
- signed-in own-session authorization;
- cost/rate guard;
- no persistent threads.

Why first: it adds value directly to data InterviewGrade already has and tests whether users want deeper help after feedback.

### Phase 2 — explicit Practice context

Extend Create Practice/document generation with explicit source kinds:

- job description;
- résumé;
- other;
- same transient privacy model;
- same editable Practice draft output.

### Phase 3 — combine job description + résumé

Support two transient context sources in one generation request and tune prompt assembly around target-vs-experience.

### Phase 4 — only from usage evidence

Consider:

- persistent Coach threads;
- saved reusable Practice context;
- DOCX context parsing;
- Coach-driven “create a follow-up Practice from this report”.

That last item is potentially powerful because it closes the loop:

```text
Report weakness
   ↓
AI Coach explains it
   ↓
Create follow-up Practice
   ↓
Practise again
```

---

## 20. Explicit non-goals

Do not revive these V1 ideas as part of this work:

- generic site-wide AI chatbot;
- résumé employability/ranking score;
- candidate ranking for employers;
- sentiment/emotion/confidence/personality inference;
- raw video analysis;
- AI rewriting persisted evaluation scores;
- automatic publishing of AI-generated Practices;
- long-term résumé storage without explicit user value and retention controls.

---

## 21. Architecture summary

| Capability | V2 placement | First persistence choice | Billing/usage |
| --- | --- | --- | --- |
| Report AI Coach | `coaching` application module over Session/Evaluation | none; single-turn | separate bounded Coach usage |
| Response AI Coach | same module scoped to SessionResponse | none; single-turn | same Coach usage |
| Job-description context | existing Practice generation flow | transient only | existing AI-created Practice allowance |
| Résumé context | existing Practice generation flow | transient only | existing AI-created Practice allowance |
| Combined JD + résumé | same generation flow with two context inputs | transient only | existing AI-created Practice allowance |
| Persistent Coach threads | future only | `coach_threads` / `coach_messages` | decide from measured usage |
| Saved context library | future only | dedicated private context model | no decision until demand |

The architectural principle is simple:

> **Coach extends Evaluation; context extends Practice generation. Neither becomes a separate product architecture.**
