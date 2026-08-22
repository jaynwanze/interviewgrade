# InterviewGrade V1 → V2 Legacy Cleanup

This document is the current execution guide for removing the original InterviewGrade runtime without losing useful product knowledge or breaking transitional V2 dependencies.

The rule is simple:

> **V2 is the product. V1 is reference/archive code until each remaining dependency is either ported, replaced, or intentionally frozen.**

Do not perform a blind repository purge. Remove legacy code only after verifying that the V2 product no longer imports, links to, or depends on it.

## Product boundary

The V2 product loop is:

**Create a Practice → complete or share it → evaluate results → improve.**

The old candidate/employer split, interview-vs-practice duplication, marketplace, unlock-token model and fixed candidate skill model are not V2 product abstractions.

## Already ported into V2

These V1 capabilities have already provided their useful value and should now be considered V2-owned:

| V1 capability | V2 status |
| --- | --- |
| Avery interviewer persona | **PORTED** — cleaner V2 interviewer card |
| Speaking-rings Lottie | **PORTED** — plays only while Avery speaks |
| OpenAI TTS | **PORTED** — used by the V2 session player |
| Browser speech fallback | **PORTED** — retained as TTS resilience |
| Audio URL / speech cleanup | **PORTED** |
| Camera / microphone interaction lessons | **PORTED AS PRODUCT BEHAVIOR** — V2 owns the current player implementation |
| Per-question feedback idea | **PORTED / REBUILT** — structured V2 response evaluations |
| Rubric-based grading | **PORTED / REBUILT** — V2 criteria, mappings and explainable scoring |
| Session snapshot/versioning idea | **PORTED / REBUILT** — PracticeVersion → Session |
| Final report concept | **PORTED / REBUILT** — V2 persisted session evaluation/report |
| Progress/dashboard chart patterns | **REFERENCE ONLY** — reuse visual ideas, not V1 analytics assumptions |
| Lottie animation library/assets | **REFERENCE AS NEEDED** — use selectively, not as a product architecture dependency |

There is no reason to preserve the old implementation of a capability merely because the capability itself remains useful.

## Transitional dependencies — keep for now

These are legacy areas that V2 still depends on or that should remain accessible until a later product decision replaces them.

### Candidate subscription / quota bridge

`src/modules/session/session-usage.service.ts` currently calls the legacy `canStartSession('practice')` path to obtain subscription limits, then combines that allowance with V2 session usage.

That means candidate subscription/product/Stripe access code cannot be deleted yet without first replacing the V2 quota boundary.

Decision: **KEEP TRANSITIONALLY.**

When the post-V2 product model/billing decision is made, replace this with a narrow V2 creator/participant usage service and then remove the old candidate billing dependency.

### Legacy History archive

The main History experience is now V2-first. Original InterviewGrade history is intentionally isolated behind the secondary **Legacy history** view.

Decision: **KEEP AS ARCHIVE FOR NOW.**

Do not combine V1 and V2 counts, scores or analytics again. The archive can later be removed from the UI while retaining historical database data for export/reference if needed.

### Supabase Auth and existing user identity

V2 still uses the existing authenticated user identity and some old candidate-oriented wrappers/routes around it.

Decision: **KEEP INFRASTRUCTURE, REPLACE PRODUCT POLICY LATER.**

The later lightweight-auth step should simplify this toward creator/participant behavior rather than expanding the existing candidate/employer role system.

### Organisation / membership primitives

The underlying organisation and membership concepts remain potentially useful for later teams/workspaces.

Decision: **KEEP DATA PRIMITIVES; DO NOT EXPAND THE OLD EMPLOYER PRODUCT.**

## Frozen V1 product surfaces

These should receive no new feature work. They may remain in the repository temporarily as reference while V2 cleanup finishes.

### Mock Interview library/runtime

Includes the old interview-template library, interview session routes and legacy interview-specific feedback/reporting flow.

Decision: **FREEZE.**

It is removed from the primary V2 candidate navigation. Do not port it as a second V2 runtime. Interview-style content should be represented as a normal V2 Practice.

### Employer marketplace / candidate search

Includes candidate discovery, candidate unlocks, employer interests, marketplace-oriented summaries and related employer dashboard behavior.

Decision: **FREEZE / DO NOT MIGRATE.**

If organisation use cases return later, build them around Practice creation, assignments and participant results rather than reviving the marketplace abstraction.

### Candidate skill-development model

Includes fixed legacy skills and historical skill cards/analytics.

Decision: **FREEZE.**

V2 rubric criteria are the flexible replacement. A Practice can measure algorithmic correctness, communication, objection handling, product knowledge, or any other creator-defined criterion without a global fixed-skill taxonomy.

### Sentiment / emotion scoring

Decision: **FREEZE / REMOVE FROM V2 SCOPE.**

V2 grading should remain explainable and rubric-based.

## Delete after dependency verification

These are candidates for physical deletion during the final repository purge, but only once code search/build checks confirm nothing V2 still imports them.

- legacy Mock Interview pages/components/data access;
- legacy Practice runtime duplicated by the V2 Practice player;
- duplicated `templates` / `interview_templates` application paths;
- duplicated legacy evaluation-criteria application paths;
- employer marketplace/search/unlock/token UI and services;
- candidate employer-interest features;
- job-application tracker;
- resume keyword/matching features that are unrelated to generic document-to-Practice generation;
- sentiment route/UI/provider code;
- old skill-development pages and fixed-skill analytics;
- dead/commented provider experiments;
- dependencies used only by removed legacy features.

Historical database tables do not need to be dropped at the same time as application code. Database destruction should be a separate, explicit migration decision.

## Primary navigation rule

The normal signed-in V2 shell should expose the V2 product, not advertise frozen V1 runtimes.

Current intended candidate navigation:

- Dashboard
- My Practices
- History
- Account Settings

Legacy history remains reachable from History as an explicit archive. Mock Interviews and other V1 product areas should not occupy primary V2 navigation.

The existing subscription/plan surface remains temporarily because V2 usage limits still rely on the legacy subscription boundary. Revisit it when the lightweight product/auth/billing decision is made.

## Cleanup sequence

1. **Hide frozen V1 surfaces from primary V2 navigation.**
2. **Keep explicit archives/reference paths where useful.**
3. **Identify actual V2 imports into legacy modules.**
4. **Replace each transitional dependency with a narrow V2 boundary.**
5. **Delete legacy application code only after its final dependency is gone.**
6. **Remove dependencies that become unused.**
7. **Run build/type/lint checks after each deletion batch.**
8. **Keep historical DB deletion separate from application-code cleanup.**

## Current status

As of the current V2 cleanup checkpoint:

- V2 Dashboard is primary;
- V2 Practice creation/publish/share/session/feedback/report works in production;
- Avery has been selectively ported into the cleaner V2 player;
- V2 History is primary and V1 History is isolated as an archive;
- Mock Interviews are frozen and should no longer appear in primary V2 navigation;
- V2 session quotas still depend on the legacy candidate subscription-limit boundary;
- critical-path E2E is intentionally deferred and should not block this cleanup pass;
- the next cleanup work is architecture/security/migration reconciliation plus replacement of the remaining transitional boundaries before any destructive legacy purge.
