# InterviewGrade V2 — Interview Experience Refactor Scope

**Status:** implementation brief / design guardrail  
**Scope type:** presentation-layer refactor; no runtime changes in this PR  
**Primary objective:** make the active interview feel focused, visual, responsive and immediate while preserving the existing InterviewGrade V2 product language, Shadcn foundation and working interview infrastructure.

## 1. Product principle

This is **not** a new InterviewGrade architecture or a new design system.

The rest of V2 should continue to feel clean, restrained and Shadcn-based. The active interview may use a more immersive composition, but it must still look like the same product.

The target interaction model is:

- before interview: normal V2 application shell;
- during interview: focused, low-density, single-stage experience;
- after each answer: concise intelligence surfaced only when useful;
- after interview: visual summary first, detail on demand.

The custom identity should come from composition, Avery presence, feedback motion and score visuals — not from replacing the existing component system.

## 2. Current repo audit

The current V2 implementation already contains most of the behaviour we need. The refactor should therefore prefer **reuse and recomposition** over replacement.

| Current file / component | Current responsibility | Decision | Target role |
| --- | --- | --- | --- |
| `src/app/session/[sessionId]/V2SessionPlayer.tsx` | Owns current question state, progress, answer submission, Avery/TTS state, feedback streaming, completion state and the current two-column interview UI | **RECOMPOSE / EXTRACT PRESENTATION** | Keep orchestration and state. Break the large render tree into focused presentation components without duplicating logic. |
| `src/app/session/[sessionId]/page.tsx` | Server-side session loading / entry into V2 player | **REUSE** | Keep route/data-loading responsibilities. Do not move interview state into a new route. |
| `src/app/session/[sessionId]/actions.ts` | Save response, advance session and complete practice server actions | **REUSE** | No behaviour change for UI PRs. |
| `src/app/session/[sessionId]/layout.tsx` | Session-level shell and back navigation | **RESTYLE LIGHTLY / RECOMPOSE** | Preserve navigation behaviour, but allow a more focused full-viewport active-session shell. |
| `src/components/Interviews/InterviewFlow/UserCamera.tsx` | Camera/mic acquisition, recording, browser speech fallback, transcription and controls | **REUSE LOGIC; LIGHT PRESENTATION ADAPTATION** | Keep media/transcription subsystem intact. Expose/compose its controls more cleanly if required; do not build a second recorder. |
| `public/assets/animations/AnimationSpeakingRings.json` | Existing Avery speaking-ring animation | **REUSE** | Keep as Avery’s visual foundation; refine size/state presentation only. |
| `@/utils/openai/textToSpeech` + `clientSpeechFallback` | OpenAI TTS plus browser voice fallback | **REUSE** | Keep current resilient audio path. |
| `/api/v2/practice-feedback` consumption in `V2SessionPlayer` | SSE feedback stream | **REUSE** | Preserve streaming infrastructure; change how partial/ready feedback is presented. |
| `@/components/ui/button`, `card`, `progress`, etc. | Existing Shadcn primitives / V2 visual foundation | **REUSE** | Continue using existing tokens and primitives. Add Sheet/Drawer/Popover/etc. only from the same component system where needed. |
| `src/app/session/[sessionId]/report/*` | V2 session report | **DEFER / RECOMPOSE LATER** | Separate follow-on PR after active interview shell is proven. |

### Key audit finding

`V2SessionPlayer` already does several things the redesign needs:

- maintains current-question/progress state;
- auto-speaks Avery questions;
- uses OpenAI TTS with browser speech fallback;
- saves answers before requesting feedback;
- advances the session independently of feedback completion;
- streams feedback over SSE and incrementally parses score/summary/advice;
- carries explicit processing, ready and unavailable feedback states;
- embeds the existing `UserCamera` recording/transcription flow.

That means the next phase is primarily a **UI composition and perceived-latency refactor**, not a backend rebuild.

## 3. Reuse rules

Every touched element should be classified before implementation:

- **REUSE** — component/logic already does the job; keep it.
- **RECOMPOSE** — behaviour is correct but its placement/hierarchy changes.
- **RESTYLE LIGHTLY** — same structure/API; adjust responsive sizing, spacing, density or presentation.
- **CREATE NEW** — only when the interaction pattern does not currently exist.

### Hard rule

Do **not** duplicate:

- session state;
- question/progress logic;
- recording/media logic;
- transcription;
- Avery/TTS;
- answer persistence;
- feedback APIs/SSE transport;
- Supabase/database structures;
- scoring/evaluation payloads;
- V2 design tokens or Shadcn primitives.

## 4. New components justified by the new composition

These are presentation components, not new subsystems.

### `InterviewFocusShell`

Full-viewport layout wrapper for an active interview.

- owns layout only;
- consumes existing state/actions;
- eliminates the dashboard-like two-column framing;
- handles desktop/mobile viewport composition.

### `QuestionStage`

Focused composition for:

- Avery presence;
- current question;
- speaking/listening/processing state;
- optional compact prep/response timing.

Prefer composing existing elements rather than moving business logic into this component.

### `InterviewControls`

Compact primary action surface.

- wraps existing recording/listen/next/finish handlers;
- does not implement its own recording system;
- remains reachable on mobile and low-noise on desktop.

### `InterviewProgress`

Maps the existing question index/count to a compact visual indicator such as dots or a subtle progress bar.

### `InsightOverlay`

New presentation layer for live feedback states:

- answer captured;
- analysing;
- score/status;
- 1–2 strengths;
- one next-focus item;
- optional expanded details.

It consumes the current streamed feedback rather than introducing a new evaluation endpoint.

### `AveryPresence`

Small wrapper around the existing speaking-ring animation and TTS state.

- idle;
- speaking;
- listening/answering context;
- processing if appropriate.

No new avatar or AI subsystem.

### `ScoreRing`

Small reusable visual score component. It can later be shared with the report/dashboard, but should not trigger a broader design-system rewrite.

## 5. Desktop target

The active interview should no longer feel like a dashboard embedded inside a session.

Current implementation uses a large camera card alongside a fixed-width Avery/question/feedback card. The target is a single focused stage.

Requirements:

- no persistent candidate dashboard/sidebar inside the active interview;
- no permanent bulky two-column information layout;
- current question + Avery + primary action dominate the hierarchy;
- progress/time are compact and peripheral;
- camera preview may remain visible but should not require a dedicated large column;
- transcript, guidance, session detail and secondary actions live in a Shadcn Sheet/Popover/Dialog/Dropdown where appropriate;
- normal active-interview use should not require page scrolling at supported desktop sizes.

## 6. Mobile target

Mobile is **not** desktop squeezed narrower.

It uses the same state, APIs and core components but a deliberate one-screen composition.

Requirements:

- one primary viewport during the active question;
- no horizontal columns;
- no permanent long feedback copy;
- question text receives the central reading area;
- primary controls stay reachable near the lower part of the screen;
- secondary content opens in a bottom Sheet/Drawer;
- live feedback appears as a compact overlay/sheet and is quick to dismiss/advance;
- account for safe-area insets, mobile browser chrome and keyboard behaviour;
- normal question/answer interaction should not page-scroll; only intentional secondary sheets may scroll.

## 7. Latency UX

The repo already streams feedback, so the first latency pass should make that infrastructure feel faster before changing models or APIs.

Visible state sequence:

`recording → captured → transcribing/saving → evaluating → first useful insight → complete`

Rules:

1. Every user action gets immediate visual acknowledgement.
2. Never leave the user staring at a disabled button with no explanation.
3. Avoid full-screen/generic loading spinners.
4. Surface the first useful structured feedback as soon as it is parsable.
5. Keep live feedback concise; detailed prose belongs in an expanded view/report.
6. Measure real latency separately before modifying backend/model architecture.

### Actual latency instrumentation follow-on

Measure timestamps for:

- recording stopped;
- media blob ready;
- transcription request start/end;
- response save start/end;
- feedback request start;
- first SSE chunk;
- first parsable useful feedback;
- feedback complete;
- rendered/interactive.

Only optimise the stages shown to be material bottlenecks.

## 8. V2 visual consistency rules

The refactor must preserve the current product feel.

- Keep existing typography and colour tokens.
- Keep existing radius, border and spacing language.
- Continue using Shadcn primitives already established in V2.
- Use subtle elevation/blur only where it improves hierarchy.
- Avoid neon AI styling, excessive gradients or generic glassmorphism.
- Do not clone Cluely visually; borrow only the principle of intelligence appearing when useful.
- Animation should communicate state rather than decorate the screen.
- Existing button/icon conventions should remain recognisable.

## 9. Final report follow-on

Report work is deliberately later than the active-session redesign.

Target hierarchy:

1. overall score/status;
2. compact competency visuals;
3. top strength;
4. highest-priority improvement;
5. scannable question navigation;
6. detailed prose on demand via Accordion/Collapsible/detail panels.

Reuse current evaluation data and scoring. No scoring/schema changes belong in that UI PR.

## 10. Explicitly out of scope

Do not combine this refactor with:

- database/schema redesign;
- Supabase replacement/migration;
- evaluation prompt or scoring changes;
- model/provider swaps merely for UI work;
- AI Coach restoration;
- MediaPipe/body-language analysis;
- employer dashboard redesign;
- global candidate dashboard redesign;
- native mobile app;
- WebRTC rewrite;
- 3D/photorealistic avatar system;
- new component library/design system;
- broad brand refresh.

## 11. Implementation sequence

### PR 1 — Focus shell + responsive composition

- extract/recompose presentation from `V2SessionPlayer`;
- introduce `InterviewFocusShell` and focused stage components where useful;
- preserve session state/actions/media/TTS/feedback behaviour;
- remove permanent two-column dependency;
- build intentional desktop/mobile compositions;
- move secondary information into existing-style progressive disclosure surfaces;
- no backend changes.

### PR 2 — Insight overlay + interaction states

- introduce `InsightOverlay`;
- map current processing/ready/unavailable feedback states into concise visual states;
- improve Avery state presentation;
- make feedback useful without creating a large permanent text panel;
- retain current SSE transport and payload parsing unless a separate issue is discovered.

### PR 3 — Latency instrumentation + targeted optimisation

- add timing instrumentation across recording → transcription → save → first feedback;
- identify actual bottleneck(s);
- make only measured, isolated latency improvements;
- preserve evaluation/scoring behaviour.

### PR 4 — Visual report refinement

- apply score-first/progressive-disclosure hierarchy to the final report;
- reuse existing report/evaluation data;
- keep detailed feedback accessible without making it the default visual surface.

## 12. Acceptance criteria

The refactor is successful when:

- the active interview remains recognisably InterviewGrade V2;
- existing session route/state/actions remain intact;
- `UserCamera` media/transcription behaviour is reused rather than rewritten;
- Avery/TTS and browser fallback remain intact;
- current SSE feedback infrastructure is retained;
- desktop no longer reads as a bulky two-column dashboard;
- mobile is intentionally composed rather than merely compressed;
- active interview use does not normally require page scrolling;
- secondary information does not permanently compete with the question;
- every answer receives immediate visible acknowledgement;
- live feedback is concise and progressively disclosed;
- new components are limited to genuinely new presentation patterns;
- no unrelated V2 architecture/design-system work is bundled into the implementation PRs.

## 13. Guardrail for implementation PRs

Each implementation PR should state, for every major changed component:

- what existing behaviour is being reused;
- what is only being recomposed/restyled;
- what genuinely new presentation component is being introduced;
- why the change does not duplicate an existing subsystem.

This document should be treated as the scope boundary for the interview UX work. If implementation reveals a need to change backend architecture, scoring, media capture or persistence, that should be raised as a separate scoped change rather than silently expanding the UI refactor.