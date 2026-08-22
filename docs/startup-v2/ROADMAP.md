# InterviewGrade Roadmap

This is the current sequencing document for InterviewGrade. It is intentionally lightweight: finish the V2 foundation first, then make the smallest product-model/auth decisions needed for the next features, and only add organisation/enterprise depth when real demand justifies it.

## Product principle

Keep the implementation narrow while preserving the broader product direction.

The core loop is:

**Create a Practice → complete or share it → evaluate results → improve.**

That loop can support self-practice and creator-to-participant sharing without requiring separate product architectures today.

The V2 product model is defined in [PRODUCT_MODEL.md](./PRODUCT_MODEL.md):

- authentication state is **Anonymous / Signed in**;
- product behavior is **Creator / Participant**;
- Creator and Participant are contextual capabilities, not permanent account types;
- `Guest` means an **Anonymous Participant**, not a third role;
- future workspace permissions remain a separate concern.

The V2 AI-usage/billing decision for the next implementation slice is defined in [PRACTICE_RUN_ENTITLEMENTS.md](./PRACTICE_RUN_ENTITLEMENTS.md):

- keep the existing Free / Pro Stripe subscription foundation;
- treat one AI-evaluated Practice session as the understandable usage unit;
- start with **3 Practice runs/month for Free** and **50 Practice runs/month for Pro**;
- self-practice and shared participant sessions draw from the Practice owner's allowance;
- shared Guests remain account-free;
- consume a run only when the first valid response is submitted, not when a link is opened or an empty session is started.

For now:

- a signed-in user can create and manage Practices;
- a participant should be able to complete a shared Practice without being forced to create an account;
- do not add heavyweight employer, workspace, SSO or integration architecture until the core V2 loop is reliable and there is evidence it is needed.

## NOW — V2 foundation accepted complete

1. **Avery speaking experience — complete**
   - Keep the cleaner V2 three-column session layout.
   - Reuse the existing Avery speaking-rings Lottie only inside the V2 interviewer card.
   - Play while Avery speaks and stop when speech ends.
   - Keep OpenAI TTS with browser speech fallback and audio/blob cleanup.

2. **Finish → report flow — complete**
   - Completing a session is the durable boundary.
   - Navigate away from the session immediately rather than waiting on a long evaluation call.
   - Show a report-generation state and preserve retry behavior if evaluation fails.

3. **History — complete**
   - V2 Practice sessions are the primary History experience.
   - V1 and V2 counts/scores are no longer mixed.
   - Original InterviewGrade sessions remain available only through an explicit Legacy history archive.

4. **Core production flow — accepted**
   - AI create → draft → publish → share → session → transcription → response evaluation → feedback → finish → final report has been exercised in production.
   - Dashboard and History reflect V2 results.
   - A ceremonial full five-answer run is not required to block the foundation; the final-question/Q5 edge case is accepted provisionally and can be covered when E2E work resumes.

5. **Legacy / architecture cleanup — complete for the current V2 boundary**
   - Frozen V1 product surfaces are removed from the primary V2 navigation.
   - V2 persistence tables are server-owned, RLS-enabled and have no direct `anon` / `authenticated` table grants.
   - The remaining legacy Practice quota dependency is isolated behind one server-only compatibility gateway without changing billing behavior.
   - V1 History remains an explicit archive instead of being mixed into V2 analytics.
   - Destructive deletion of legacy application/database code is intentionally deferred until the post-V2 product/auth/billing decisions remove the final compatibility reasons to keep it.

6. **Non-blocking follow-ups — deferred**
   - Critical-path E2E should eventually protect creator → publish → shared Practice → participant session → persisted evaluation → report, including the final-question/Q5 edge case.
   - The three manually applied V2 Supabase migrations still need the documented `migration repair --status applied` bookkeeping step; do not rerun their DDL.
   - These items are valuable engineering hygiene, but they do not block moving beyond the V2 foundation checkpoint.

## THEN — Lightweight product expansion

1. **Product model + lightweight auth decision — complete**
   - Creator and Participant are contextual product behaviors rather than mutually exclusive user types.
   - Guest is not a permanent role; it means an anonymous Participant.
   - Creating/managing Practices and retaining account history require sign-in.
   - Opening and completing a normal shared Practice remains account-free by default.
   - Future workspace roles are kept separate from the core Practice model.
   - See [PRODUCT_MODEL.md](./PRODUCT_MODEL.md).

2. **Google sign-in — complete for current scope**
   - Google is available as a low-friction sign-in option alongside the existing email path.
   - Shared Practice participation remains account-free and does not require Google.
   - Supabase automatically links a Google identity to an existing verified-email account; therefore a legacy employer signing in with the same email correctly retains the existing employer account behavior.
   - New OAuth users without legacy `userType` metadata enter the V2 signed-in shell rather than being treated as employers.
   - **Deferred branding polish:** the Google hand-off currently shows the Supabase project hostname (`<project-ref>.supabase.co`). Revisit later with a Supabase custom auth domain such as `auth.interviewgrade.io` or direct Google Identity Services / ID-token sign-in. This is UX polish, not an auth blocker.

3. **Upload document → Generate Practice — PDF/TXT path complete**
   - Text-based PDF and TXT upload is live in production and has been smoke-tested with a realistic source document.
   - Source text is extracted server-side, passed into the existing V2 Practice generator, and lands in the normal editable editor.
   - The original file is not retained and local filenames are not persisted into the editor URL/history.
   - Unsupported, oversized, empty/scanned and overlong sources fail explicitly rather than being silently truncated.
   - DOCX remains an intentionally small parser/dependency follow-up; it does not block moving to the next product slice.

4. **Better sharing and creator results — complete for current slice**
   - Creators have a direct copy-share-link action from My Practices.
   - Each Practice has a creator-owned Results view covering attempts across published versions.
   - Optional participant name/email is surfaced only when supplied; anonymous attempts remain valid.
   - Creator result review is read-only and backed by the existing immutable session/evaluation data.
   - The shared Practice start experience makes creator visibility of responses/results explicit without adding assignment/workspace architecture.

5. **V2 Practice-run entitlements + shared-link abuse protection — active**
   - Keep the working Free / Pro Stripe subscription machinery instead of rebuilding payments.
   - Define V2 usage independently from the old Candidate `interviews` monthly counter.
   - Start with **Free = 3 AI-evaluated Practice runs/month** and **Pro = 50/month**.
   - Use one allowance for self-practice and participant runs on Practices owned by the account.
   - A Guest never pays or signs up merely to complete an available shared Practice.
   - Consume exactly one run when the session submits its first valid response; later questions/retries/final report remain included.
   - Add a V2 server-owned usage ledger with idempotent one-row-per-session accounting.
   - Make the allowance reservation atomic so concurrent participants cannot oversubscribe the owner's remaining usage.
   - Separately rate-limit abusive empty public-session creation/start attempts; empty starts must not consume paid usage.
   - See [PRACTICE_RUN_ENTITLEMENTS.md](./PRACTICE_RUN_ENTITLEMENTS.md) for the accepted implementation scope.

6. **Practice lifecycle delete/archive polish — queued after entitlements**
   - Add a compact trash/bin action to Practice cards with an explicit confirmation dialog.
   - Draft Practices with no participant history may be permanently deleted.
   - Published Practices, or any Practice with session/result history, should be archived rather than physically deleted so historical reports remain valid.
   - Archiving should remove the Practice from the normal My Practices view and stop its public share link from accepting new sessions.
   - Existing creator Results and participant reports must remain readable after archival.
   - Add a lightweight Archived filter/view later so creators can inspect or restore archived Practices if useful.
   - Do not introduce a new lifecycle table for this; reuse the existing `practices.status = 'archived'` state and current referential protections.

7. **Participant mobile UX before wider launch**
   - Keep creator/editor workflows desktop-first rather than forcing complex authoring onto a phone.
   - Make the shared Practice page, Avery session, recording, feedback and report usable on modern mobile browsers.
   - Do not hard-block phones or require an app install to open a shared Practice link.
   - Consider PWA/native-app work later only if repeat participant usage creates a clear benefit.

## LATER — Only if demand exists

Do not build these merely because the architecture could support them.

- **Teams / workspaces** — multiple creators, shared Practice ownership and organisation-level administration.
- **Assignments** — targeted participants, due dates, cohorts and completion tracking.
- **ATS / LMS integrations** — launch InterviewGrade Practices from existing employer/training systems and return results.
- **Enterprise auth** — SSO, Microsoft/Google Workspace administration and other organisation-specific controls.
- **Native mobile app** — only if repeat learner/participant behavior justifies install friction and app-specific capabilities such as notifications or deeper device integration.

These should be driven by actual customer/use-case demand rather than treated as prerequisites for the lightweight core product.

## Current restart point

At the current checkpoint:

- the V2 foundation is accepted complete;
- the lightweight Creator / Participant product model is decided and documented;
- Guest is treated as an anonymous Participant rather than a third account role;
- Dashboard, Avery, Practice creation/share/session/feedback/report and V2-first History are live;
- V2 database access is hardened and the remaining legacy billing dependency is quarantined behind a narrow compatibility boundary;
- Google sign-in is live for the current scope; the visible Supabase OAuth hostname is documented deferred branding polish;
- PDF/TXT document → Practice is live and production-smoke-passed; DOCX remains a small deferred follow-up;
- creator copy-sharing and Practice Results are implemented for the current lightweight scope;
- Practice delete/archive UX is recorded as near-term lifecycle polish after entitlement protection rather than interrupting the active cost-safety work;
- E2E and Supabase migration-history repair are documented deferred follow-ups;
- **the active implementation step is V2 Practice-run entitlements and shared-link abuse protection, scoped in [PRACTICE_RUN_ENTITLEMENTS.md](./PRACTICE_RUN_ENTITLEMENTS.md).**
