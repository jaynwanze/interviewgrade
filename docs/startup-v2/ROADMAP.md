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

3. **History — next**
   - Verify completed V2 Practice sessions appear in the user-facing History experience.
   - Remove or isolate legacy V1 data assumptions where they conflict with V2 sessions/reports.
   - Keep historical V1 behavior intact unless intentionally migrated.

4. **Full 5/5 production test**
   - Run one clean published Practice through all five questions.
   - Verify five saved responses and five response evaluations.
   - Verify final report generation, V3 rubric-weighted aggregation and question-to-criterion mapping behavior.
   - Verify dashboard/history reflect the completed V2 session correctly.

5. **Critical-path E2E**
   - Protect the creator → publish → shared Practice → participant session → persisted evaluation → report path.
   - Mock or fake expensive media/AI boundaries where appropriate in CI while keeping persistence and navigation assertions meaningful.

6. **V2 cleanup**
   - Reconcile manually applied Supabase migration history.
   - Review V2 grants/RLS/GraphQL exposure separately from product work.
   - Remove temporary fallback/strangler code that is no longer needed.
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

At the time this roadmap was written:

- the V2 dashboard has been separated from the legacy V1 candidate skill-card dashboard;
- the Finish Practice/report navigation fix has been merged;
- Avery speaking rings, browser TTS fallback and audio cleanup have been merged;
- **History integration is the next active implementation task.**
