# InterviewGrade Roadmap

This is the current sequencing document for InterviewGrade. Keep the shipped V2 Practice loop reliable, close the remaining launch-hardening work, then add small coaching improvements only where they create clear user value.

## Product principle

The core loop is:

**Create a Practice → complete or share it → evaluate results → improve.**

That loop supports self-practice and creator-to-participant sharing without requiring separate product architectures today.

The V2 product model is defined in [PRODUCT_MODEL.md](./PRODUCT_MODEL.md):

- authentication state is **Anonymous / Signed in**;
- product behavior is **Creator / Participant**;
- Creator and Participant are contextual capabilities, not permanent account types;
- `Guest` means an **Anonymous Participant**, not a third role;
- future workspace permissions remain a separate concern.

Current individual V2 usage is intentionally simple:

- **Free:** 3 AI-evaluated Practice runs/month + 3 AI Practice generations/month;
- **Pro (€9.99/month):** 30 AI-evaluated Practice runs/month + 30 AI Practice generations/month;
- self-practice and shared participant runs draw from the Practice owner's run allowance;
- a Guest remains account-free and never pays merely to complete an available shared Practice;
- a Practice run is consumed only on the first valid response in a session;
- manual Practice creation/editing remains unlimited.

The original run-entitlement decision and accounting model are documented in [PRACTICE_RUN_ENTITLEMENTS.md](./PRACTICE_RUN_ENTITLEMENTS.md). The original 50-run Pro target was later tightened to 30 in production after the entitlement path was implemented; production limits and Plan & Usage are the current source of truth.

## V2 foundation — accepted complete

1. **Practice model, editor, publish/share and immutable versions — complete**
   - AI create, document create, manual edit, publish and share use the V2 Practice model.
   - Published sessions remain pinned to immutable Practice versions.

2. **Participant session + Avery + feedback + report — complete for current scope**
   - Avery uses OpenAI TTS with browser speech fallback and speaking rings.
   - Responses are persisted before immediate feedback/progress changes.
   - Completing a session navigates immediately to report generation rather than waiting on the long evaluation request.
   - Final reports use the current rubric-weighted session aggregation model while preserving historical report semantics.
   - Microphone-only fallback remains available when camera access is unavailable.

3. **Dashboard and History — complete for current V2 boundary**
   - Dashboard and primary History are V2-first.
   - V1 sessions remain available only through an explicit legacy archive rather than being mixed into V2 analytics.

4. **Legacy / database boundary — complete for current scope**
   - Frozen V1 product surfaces are removed from the primary V2 navigation.
   - V2 persistence tables are server-owned, RLS-enabled and have no direct `anon` / `authenticated` grants.
   - Remaining V1 compatibility is isolated instead of being allowed to define the V2 product.
   - Destructive V1 deletion remains intentionally deferred.

## Lightweight product expansion — shipped

1. **Product model + Google sign-in**
   - Creator and Participant are contextual behaviors rather than permanent account roles.
   - Shared Practice participation remains account-free.
   - Google sign-in is live alongside email auth.
   - The visible Supabase OAuth hostname remains deferred branding polish.

2. **Upload document → Generate Practice**
   - Text-based PDF and TXT upload is live and production-smoke-passed.
   - Source text is extracted server-side and routed through the normal editable Practice draft flow.
   - Original files and local filenames are not retained.
   - DOCX remains a small deferred parser follow-up.

3. **Creator sharing, lifecycle and Results**
   - Published Practice cards support direct copy/open/results actions.
   - Safe lifecycle behavior is live: unused drafts can be deleted; published/history-bearing Practices archive instead of destroying results.
   - Creator Results supports participant attempt drill-down, completion rate, average/median score, score distribution and rubric criterion averages across evaluated attempts.

4. **V2 cost and abuse protection**
   - `practice_run_usage` owns V2 monthly Practice-run accounting.
   - Free = 3 and Pro = 30 AI-evaluated Practice runs/month.
   - Reservation is atomic and idempotent per session; the first valid response is the consumption boundary.
   - Public empty-session starts are separately limited to 30 starts per Practice in a rolling hour and do not consume paid run allowance.
   - AI Practice generation has its own server-owned usage ledger: Free = 3 and Pro = 30/month.
   - Plan & Usage exposes the current V2 allowances while retaining the existing Stripe checkout/portal/subscription foundation.

5. **Participant mobile UX — shipped for current scope**
   - Shared Practice entry prioritizes the Start action on narrow screens while retaining scenario/rubric context.
   - Pre-session Begin is reachable without desktop-first scrolling assumptions.
   - Avery → participant recording → feedback stacks cleanly on mobile without desktop-sized minimum card heights.
   - Camera/microphone, transcription, immediate feedback, next-question and finish semantics remain unchanged.
   - Creator/editor authoring remains desktop-first; no native app or install requirement is introduced.

## NOW — Launch hardening

The core V2 production/UX work is no longer the active feature build. What remains is focused reliability work rather than another redesign.

1. **Critical-path E2E**
   - Protect creator sign-in → create/edit → publish → shared Practice → participant answer → persisted feedback → finish → report → creator result.
   - Include the final-question/Q5 completion edge case.
   - Use provider fakes where appropriate so CI is deterministic.

2. **Supabase migration-history repair**
   - Perform the already documented `supabase migration repair --status applied` bookkeeping for the three original manually applied V2 migrations.
   - Do not rerun their DDL.

3. **Evidence-driven production polish**
   - Fix real browser/mobile/production issues as observed.
   - Do not reopen scoring, session semantics or billing merely for visual churn.

## NEXT — Better speech delivery metrics

After the launch-hardening checkpoint, the next recommended product experiment is objective spoken-delivery coaching.

First slice:

- answer duration;
- word count;
- speaking pace / words per minute;
- low-ambiguity filler count/rate;
- clear separate Delivery/Speaking UI that does not silently alter creator-defined rubric scores.

Pause/cadence metrics should wait until InterviewGrade has a reliable timing source rather than being guessed from plain transcript text.

See [DELIVERY_COACHING.md](./DELIVERY_COACHING.md) for implementation boundaries, acceptance criteria and guardrails.

## AFTER — Browser-side visual delivery prototype

Only after speech metrics are useful in real sessions:

- prototype MediaPipe Face/Pose Landmarker directly in the browser;
- aggregate a small set of observable framing signals locally;
- keep raw video out of the server-side pipeline for the first prototype;
- make the feature opt-in and Practice/coaching focused;
- keep visual observations separate from competency/rubric scoring by default;
- do not infer confidence, nervousness, honesty, personality or emotion from face/body movement.

A Python/Supervision service is **not** the next step. It remains deferred until a validated browser prototype exposes a concrete need for server-side tracking, offline analysis or model interchange.

## Small launch-quality follow-ups — choose from evidence

These remain valid but should not interrupt the core reliability checkpoint or be treated as mandatory architecture work:

- DOCX source-document support;
- Archived Practice filter/restore;
- participant/creator Results filtering or export if actual creator usage needs it;
- Google OAuth custom-domain branding;
- focused public/pricing copy cleanup where V1 wording remains;
- data-retention/deletion and observability improvements before broader pilots where needed.

## LATER — Only if demand exists

Do not build these merely because the architecture could support them.

- **Teams / workspaces** — multiple creators, shared Practice ownership and organisation-level administration.
- **Assignments** — targeted participants, due dates, cohorts and completion tracking.
- **ATS / LMS integrations** — launch InterviewGrade Practices from existing employer/training systems and return results.
- **Enterprise auth** — SSO, Microsoft/Google Workspace administration and other organisation-specific controls.
- **Native mobile app** — only if repeat learner/participant behavior justifies install friction and app-specific capabilities such as notifications or deeper device integration.
- **Server-side computer vision / Supervision** — only after browser-side visual coaching demonstrates real value and needs capabilities the browser path cannot provide simply.

## Current restart point

At this checkpoint:

- the V2 foundation and core Practice loop are live;
- Creator / Participant product semantics and Google sign-in are live;
- PDF/TXT document generation is live; DOCX is deferred;
- Practice sharing, safe delete/archive lifecycle and richer Creator Results analytics are live;
- V2 Practice-run, shared-link abuse and AI-generation cost protections are live;
- Free is 3/3 and Pro is 30/30 for monthly Practice runs / AI Practice generations;
- Plan & Usage and the existing Stripe Pro subscription are aligned to those production limits;
- participant mobile UX is shipped for the current shared Practice → session → feedback → report flow;
- **the active implementation step is launch hardening: critical-path E2E plus Supabase migration-history repair, followed by the first better-speech-metrics slice.**
