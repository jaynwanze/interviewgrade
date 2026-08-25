# InterviewGrade Roadmap

This is the current sequencing document for InterviewGrade. Keep the shipped V2 Practice loop reliable, finish launch/security follow-through, then add product extensions only where they deepen the core Practice → feedback → improvement loop.

For the concise end-of-day restart point, read [CURRENT_STATUS.md](./CURRENT_STATUS.md).

## Product principle

The core loop is:

**Create a Practice → complete or share it → evaluate results → improve → practise again.**

The V2 product model is defined in [PRODUCT_MODEL.md](./PRODUCT_MODEL.md):

- authentication state is **Anonymous / Signed in**;
- product behavior is **Creator / Participant**;
- Creator and Participant are contextual capabilities, not permanent account types;
- `Guest` means an **Anonymous Participant**;
- future workspace permissions remain a separate concern.

Current individual usage:

- **Free:** 3 AI-evaluated Practice runs/month + 3 AI-created Practices/month;
- **Pro (€9.99/month):** 30 AI-evaluated Practice runs/month + 30 AI-created Practices/month;
- self-practice and shared participant runs draw from the Practice owner's run allowance;
- a Practice run is consumed only on the first valid response in a session;
- manual Practice creation/editing remains unlimited.

## V2 foundation — shipped

1. **Practice model, editor, publish/share and immutable versions**
   - AI creation, context/document creation and manual creation use the V2 Practice model.
   - Published sessions remain pinned to immutable Practice versions.

2. **Participant session + Avery + feedback + report**
   - voice capture, transcription, Avery TTS/fallback and rubric-based feedback are live;
   - responses persist before progress/feedback transitions;
   - completion hands off to report generation without blocking on the long report request;
   - final reports use rubric-weighted aggregation;
   - microphone-only fallback remains available when camera access is unavailable.

3. **Dashboard, History and creator Results**
   - primary surfaces are V2-first;
   - legacy history remains isolated as compatibility/archive data;
   - creator Results supports participant drill-down and aggregate score/rubric analytics.

4. **Identity, sharing and billing**
   - Google and email authentication are live;
   - shared Practice participation remains account-free;
   - Free/Pro Practice-run and AI-created Practice allowances are server-owned;
   - Plan & Usage reflects 3/3 Free and 30/30 Pro limits.

5. **Participant mobile UX**
   - shared entry, pre-session start, session controls, feedback and report flows are usable on narrow screens;
   - creator/editor authoring remains desktop-first.

6. **Critical-path E2E — shipped (#127)**
   - protects creator → create/publish → anonymous participant → saved responses → feedback → final question/Q5 → report → creator Results;
   - uses deterministic provider/media boundaries for Playwright rather than production AI calls.

## Security hardening — major application fixes shipped

The 2026-08-25 security pass closed the highest-risk application/database findings:

- #113 — enable RLS on exposed legacy tables;
- #114 — narrow organization/profile/invitation RLS;
- #115 — rate-limit public TTS/transcription;
- #116 — harden legacy `SECURITY DEFINER` functions;
- #117 — retire unused legacy AI compute and protect legacy feedback;
- #118 — remove unrestricted public Storage policies;
- #119 — constrain account-deletion token inserts to the current user;
- #125 — retire the unauthenticated application-email relay.

Production verification established that browser roles no longer have the dangerous table-grant + RLS-disabled combination found during the audit, and unrestricted Storage policies were removed.

### Remaining security/platform follow-through

Issue #107 remains open until the remaining external/platform items are resolved or explicitly documented:

- inspect the actual GitHub Dependabot/security-alert list when available;
- reduce hosted Supabase Auth OTP expiry to under one hour;
- enable Supabase leaked-password protection;
- schedule the available Supabase/Postgres platform security upgrade;
- apply branded hosted Supabase Auth templates and custom SMTP separately from the repository templates.

## Product improvement loop — shipped

### Report-grounded AI Coach (#130)

AI Coach now extends the existing Evaluation/report flow rather than creating a generic chatbot.

First shipped slice:

- signed-in own completed session only;
- report/response context resolved server-side;
- suggested prompts plus a short custom question;
- persisted Evaluation remains authoritative and is never mutated by Coach;
- no persistent chat threads;
- no personality/emotion/confidence/honesty/employability or hiring inference;
- bounded usage: 5 questions per result and burst max 3 per 10 minutes.

The dedicated production Supabase Coach usage migration has been applied.

See [AI_COACH_AND_PRACTICE_CONTEXT.md](./AI_COACH_AND_PRACTICE_CONTEXT.md).

### Job-description / résumé Practice context (#133)

The existing Create Practice document path now accepts an explicit context kind:

- job description;
- résumé / CV;
- other source document.

The existing PDF/TXT extraction, size/type/text validation and editable `PracticeDraft` flow are reused. Files and extracted text remain transient by default. Résumé generation is constrained to experience explicitly present in the source and does not become a résumé-scoring or employability product.

Follow-ups remain evidence-driven:

- combined JD + résumé request;
- DOCX;
- reusable saved context only if users actually need reuse enough to justify retention/privacy cost.

### Coach → follow-up Practice (#135)

The improvement loop is now closed:

**report → Ask Coach → Create a follow-up Practice → editable Practice draft → practise again.**

The follow-up generation brief is rebuilt server-side from persisted weaknesses, improvement areas and recommendation. Raw transcript text and browser-supplied Coach text are excluded. The normal AI-created Practice allowance applies and generated follow-ups are never auto-published.

### Session navigation (#132)

The active session route tree now has a shared Back action across the live session, report-generating state, final report and terminal session states. Signed-in users return to Dashboard; guests return to InterviewGrade home.

## NOW — Deployment + launch follow-through

At the end of 2026-08-25, `master` is ahead of production because the Vercel account hit the daily deployment limit.

The last confirmed READY production deployment observed that day was #127. #130, #132, #133 and #135 are merged to `master` but must be verified after Vercel can deploy again.

Immediate sequence:

1. Confirm Vercel quota reset and deploy current `master` to production.
2. Smoke-test AI Coach, Coach → follow-up Practice, JD/résumé context and shared session Back navigation in production.
3. Finish issue #107 platform/dependency-alert follow-through.
4. Fix only concrete production/browser issues found during those checks.

## NEXT — Objective speech delivery metrics

After the deployment/security checkpoint is clean, the next recommended product experiment is objective spoken-delivery coaching.

First slice:

- answer duration;
- word count;
- speaking pace / words per minute;
- low-ambiguity filler count/rate;
- separate Delivery/Speaking UI that does not silently alter creator-defined rubric scores.

Pause/cadence metrics should wait until InterviewGrade has a reliable timing source rather than being guessed from plain transcript text.

See [DELIVERY_COACHING.md](./DELIVERY_COACHING.md).

## AFTER — Browser-side visual delivery prototype

Only after speech metrics are useful in real sessions:

- prototype MediaPipe Face/Pose Landmarker directly in the browser;
- aggregate a small set of observable framing signals locally;
- keep raw video out of the server-side pipeline for the first prototype;
- make the feature opt-in and coaching-focused;
- keep visual observations separate from competency/rubric scoring by default;
- do not infer confidence, nervousness, honesty, personality or emotion from face/body movement.

A Python/Supervision service remains deferred until a validated browser prototype exposes a concrete need for server-side tracking/offline analysis.

## Small launch-quality follow-ups — choose from evidence

These are valid, but should not interrupt production reliability work merely for feature count:

- DOCX context/document support;
- combined JD + résumé Practice context;
- Archived Practice filter/restore;
- creator Results filtering/export if usage needs it;
- Google OAuth custom-domain branding;
- hosted Supabase branded auth emails/custom SMTP;
- public/pricing copy cleanup where stale V1 language still surfaces;
- data-retention/deletion and observability improvements before broader pilots.

## LATER — only if demand exists

Do not build these simply because the architecture can support them:

- persistent Coach threads;
- saved Practice context library;
- standalone résumé analysis/scoring;
- teams/workspaces with multiple creators;
- assignments/cohorts/due dates;
- ATS/LMS integrations;
- enterprise SSO/admin;
- native mobile app;
- server-side computer vision.

## Current restart point

See [CURRENT_STATUS.md](./CURRENT_STATUS.md). The short version is:

**deploy current master → production smoke test → finish #107 external/platform security follow-through → objective speech-delivery metrics, unless production evidence changes the priority.**
