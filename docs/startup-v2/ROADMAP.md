# InterviewGrade Roadmap

This is the current sequencing document for InterviewGrade. It is intentionally lightweight: finish the V2 foundation first, then make the smallest product-model/auth decisions needed for the next features, and only add organisation/enterprise depth when real demand justifies it.

## Product principle

Keep the implementation narrow while preserving the broader product direction.

The core loop is:

**Create a Practice → complete or share it → evaluate results → improve.**

That loop can support self-practice and creator-to-participant sharing without requiring separate product architectures today.

For now:

- a signed-in user can create and manage Practices;
- a participant should be able to complete a shared Practice without being forced to create an account;
- do not add heavyweight employer, workspace, SSO or integration architecture until the core V2 loop is reliable and there is evidence it is needed.

## NOW — Finish the V2 foundation

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

4. **Core production flow — accepted for now**
   - AI create → draft → publish → share → session → transcription → response evaluation → feedback → finish → final report has been exercised in production.
   - Dashboard and History reflect V2 results.
   - A ceremonial full five-answer run is not required to block the foundation; the final-question/Q5 edge case is accepted provisionally and can be covered when E2E work resumes.

5. **Critical-path E2E — deferred**
   - Eventually protect creator → publish → shared Practice → participant session → persisted evaluation → report.
   - Include the final-question/Q5 completion edge case.
   - Mock or fake expensive media/AI boundaries where appropriate in CI while keeping persistence and navigation assertions meaningful.
   - This is valuable follow-up work, but it is intentionally not blocking the current V2 cleanup pass.

6. **V2 cleanup — active**
   - Use [LEGACY_CLEANUP.md](./LEGACY_CLEANUP.md) as the execution guide for port/freeze/transitional/delete decisions.
   - Remove frozen V1 product surfaces from primary V2 navigation without blindly deleting reference code.
   - Reconcile manually applied Supabase migration history.
   - Review V2 grants/RLS/GraphQL exposure separately from product work.
   - Replace remaining transitional V2 → legacy dependencies before destructive code deletion.
   - Finish the V2 architecture/documentation audit.
   - Declare the V2 foundation complete before widening scope.

## THEN — Lightweight product expansion

Once the V2 foundation is complete, make the minimum product decisions required for the next growth loop.

1. **Product model + lightweight auth decision**
   - Formalize the Creator + Participant model without forcing a large role-system rewrite.
   - Decide the minimum account requirements for creators versus participants.
   - Preserve account-free shared Practice participation by default where practical.

2. **Google sign-in**
   - Add Google as a low-friction creator/sign-in option alongside the existing email/magic-link path.
   - Do not make Google auth a prerequisite for participants opening shared Practices.

3. **Upload document → Generate Practice**
   - Support PDF, DOCX and TXT first.
   - Extract source text and feed it into the existing V2 AI Practice generator.
   - Always create an editable V2 Draft before publishing.
   - Do not create a parallel document-specific Practice architecture.

4. **Better sharing and results**
   - Improve creator-facing result review and participant identity where useful.
   - Improve shared-link UX and optional participant capture.
   - Add richer result/analytics presentation only when it is backed by meaningful V2 evidence.

## LATER — Only if demand exists

Do not build these merely because the architecture could support them.

- **Teams / workspaces** — multiple creators, shared Practice ownership and organisation-level administration.
- **Assignments** — targeted participants, due dates, cohorts and completion tracking.
- **ATS / LMS integrations** — launch InterviewGrade Practices from existing employer/training systems and return results.
- **Enterprise auth** — SSO, Microsoft/Google Workspace administration and other organisation-specific controls.

These should be driven by actual customer/use-case demand rather than treated as prerequisites for the lightweight core product.

## Current restart point

At the current checkpoint:

- V2 Dashboard is primary;
- Finish Practice/report navigation is fixed;
- Avery speaking rings, browser TTS fallback and audio cleanup are live;
- V2 History is primary and legacy history is isolated as an archive;
- the core production flow is accepted for now and E2E is intentionally deferred;
- **V2 legacy/architecture/security cleanup is the active implementation step.**
