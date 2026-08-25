# InterviewGrade Current Status

_Last updated: 2026-08-25_

This is the concise restart/checkpoint document for the active InterviewGrade V2 product. Use `ROADMAP.md` for sequencing and the deeper architecture documents for design rationale.

## Current product state

The core V2 loop is shipped:

**Create a Practice → publish/share → complete by voice → rubric feedback → final report → improve.**

Current individual product model:

- **Free:** 3 AI-evaluated Practice runs/month + 3 AI-created Practices/month.
- **Pro (€9.99/month):** 30 AI-evaluated Practice runs/month + 30 AI-created Practices/month.
- Manual Practice creation/editing is unlimited.
- Shared participants can remain anonymous/guest users.
- Shared participant runs consume the Practice owner's run allowance on the first valid response.

## Shipped foundation

- V2 Practice / immutable PracticeVersion / Session / Response / Evaluation model.
- Manual Practice creation and editor.
- AI-created Practices.
- PDF/TXT Practice creation.
- Publish/share flow and anonymous participant flow.
- Voice capture, transcription, Avery TTS/fallback and rubric-based immediate feedback.
- Final rubric-weighted reports and PDF export.
- Dashboard, V2 History and creator Results analytics.
- Google sign-in.
- Free/Pro entitlements and Plan & Usage.
- Mobile participant/session/report polish.
- Critical-path Playwright smoke coverage for creator → shared participant → Q5/final report → creator Results (#127).

## 2026-08-25 product additions

### AI Coach — shipped in master (#130)

AI Coach is report-grounded rather than a generic chatbot:

- signed-in participant, own completed session only;
- trusted PracticeVersion/transcript/Evaluation context is resolved server-side;
- suggested prompts plus a bounded custom question;
- Coach cannot change persisted scores;
- no personality/emotion/confidence/honesty/employability inference;
- no persistent Coach threads in the first slice;
- separate usage control: max 5 Coach questions per result, burst max 3 requests per 10 minutes.

The production Supabase `coach_usage` migration and reservation function have been applied.

### Job-description / résumé Practice context — shipped in master (#133)

The existing PDF/TXT creation path now accepts an explicit source kind:

- Job description;
- Résumé / CV;
- Other source document.

The file/extracted text remains request-scoped and is not persisted by this flow. JD generation emphasizes role requirements and scenarios; résumé generation is instructed to use only personal facts explicitly present in the source. It does not score employability or make hiring/ranking predictions.

### Coach → follow-up Practice — shipped in master (#135)

After receiving Coach guidance, a signed-in participant can create a focused editable follow-up Practice.

The server reconstructs the generation brief from persisted report weaknesses, improvement areas and recommendation. Raw transcript text and browser-provided Coach text are deliberately excluded from this follow-up generation path. The action uses the normal AI-created Practice allowance and never auto-publishes.

### Session navigation — shipped in master (#132)

Active `/session/[sessionId]` routes now inherit a shared Back action:

- signed-in users → Dashboard;
- guests → InterviewGrade home;
- applies across live session, generating report, final report and terminal session states.

## 2026-08-25 security hardening completed

Merged security work includes:

- #113 — enable RLS on exposed legacy tables;
- #114 — narrow legacy organization/profile/invitation access;
- #115 — durable rate limits for public OpenAI-backed TTS/transcription;
- #116 — harden legacy `SECURITY DEFINER` functions and ACLs;
- #117 — retire unused legacy AI compute endpoints and protect legacy feedback;
- #118 — remove unrestricted public Storage policies;
- #119 — bind account-deletion token inserts to the current user;
- #125 — retire the unauthenticated legacy application-email relay.

Production verification established that no public-schema table remains browser-readable/writable while RLS is disabled, and the unrestricted Storage policy class is removed.

### Security items still requiring manual/platform follow-up

- Hosted Supabase Auth email templates/custom SMTP still need to be applied in the Supabase Dashboard; branded templates exist in the repository but are not yet the hosted production templates.
- Reduce Supabase Auth email OTP expiry to under one hour.
- Enable leaked-password protection in Supabase Auth.
- Schedule the available Supabase/Postgres platform security upgrade.
- Exact private GitHub Dependabot/security-alert findings were not available through the connected GitHub tooling, so issue #107 should not be considered fully closed until those alerts are reviewed or supplied separately.

## Deployment caveat at end of day

`master` is currently ahead of production because the Vercel account hit its daily deployment limit (`api-deployments-free-per-day`).

The last confirmed READY production deployment observed today was based on #127. Later merged work (#130, #132, #133, #135) is in `master` but may not be visible on `interviewgrade.io` until the Vercel quota resets and a new production deployment succeeds.

GitHub typecheck/lint and migration checks were green before the above merges.

## Tomorrow restart point

1. Confirm Vercel quota has reset and deploy/current `master` reaches production.
2. Smoke-test production AI Coach, Coach → follow-up Practice, JD/résumé context and session Back navigation.
3. Finish issue #107 documentation/remaining platform actions and review any actual GitHub dependency/security alerts available to the account.
4. Then continue the roadmap with objective speech-delivery metrics unless production evidence surfaces a higher-priority reliability issue.

Do not reopen scoring, billing semantics, or legacy employer/candidate product architecture without evidence that the current V2 core requires it.
