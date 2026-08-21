# InterviewGrade agent guidance

This repository contains the original InterviewGrade application plus the startup-v2 migration work.

Before changing v2 domain behavior, read the relevant source-of-truth docs under `docs/startup-v2/` rather than inferring product rules from legacy code.

## Required references

- `docs/startup-v2/README.md` — product direction and MVP boundary.
- `docs/startup-v2/ARCHITECTURE.md` — v2 module boundaries and architecture.
- `docs/startup-v2/DATABASE_MODEL.md` — v2 persistence model.
- `docs/startup-v2/SCORING.md` — canonical scoring, rubric mapping and aggregation rules.

## Scoring changes

If a change touches response evaluation, rubric mappings, criterion weights, question scores, session scores or final reports, read `docs/startup-v2/SCORING.md` first.

Important invariants:

1. The AI model produces criterion-level evidence scores; deterministic application code calculates weighted totals.
2. Questions are scored only against their mapped criteria.
3. Question-level mapped weights are normalized.
4. The final report uses the latest attempt per question.
5. Session criterion scores average only answered mapped evidence.
6. Criteria with no evidence are omitted rather than treated as zero.
7. The session overall score is the weighted average of session-level criterion scores, normalized across criteria with evidence.
8. Published PracticeVersion questions, mappings and rubric weights are immutable for existing Sessions.
9. When scoring semantics change, update `SESSION_AGGREGATION_VERSION`, `docs/startup-v2/SCORING.md`, the report explanation and relevant tests in the same PR.

Do not reintroduce a simple unweighted average of question totals as the session score: that can override the creator's rubric weights when different questions map to different criteria.

## Migration discipline

V2 is being cut over with a strangler approach. Prefer small isolated changes that move runtime behavior toward the v2 Practice -> PracticeVersion -> Session -> Response -> Evaluation model without breaking legacy Mock Interview flows.

Do not use legacy tables or browser Supabase queries as a shortcut for new v2 domain logic unless the migration plan explicitly calls for a temporary bridge.
