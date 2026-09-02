# InterviewGrade V2 — UI/UX Product Polish Plan

Status: implementation brief before code changes

## Goal

Evolve the current InterviewGrade V2 experience from a clean SaaS interface into a more focused training product without changing the brand, design system, backend architecture, scoring model, or core interview infrastructure.

The current product already has a strong visual base: dark surfaces, white primary actions, thin borders, restrained muted text, rounded Shadcn-style cards, simple iconography, Avery presence, compact progress and rubric UI. The next step is not a redesign. It is a hierarchy, density and interaction pass.

> Training should feel experiential, not administrative.

During Practice, the interface should feel like one intentional interview stage. Intelligence should appear when useful instead of existing as a permanent block of UI.

## Inspiration boundary

Recent roleplay/coaching products are useful references because they solve a similar interaction problem: setup, live practice, coaching and performance review.

Borrow:

- one dominant task per screen
- stronger hierarchy and less simultaneous UI
- large product moments instead of stacked explanatory sections
- concise live-feedback checkpoints
- product-led landing-page storytelling
- mobile-first action placement

Do not copy:

- another company's colour system
- oversized marketing typography throughout the app
- unrelated navigation patterns
- a new design system
- decorative AI gradients or gimmicks

InterviewGrade keeps its existing V2 identity and Shadcn foundation.

## Current baseline and reuse decisions

The live Practice player already has most of the correct infrastructure:

### REUSE

- `src/app/session/[sessionId]/V2SessionPlayer.tsx`
  - question/progress state
  - Avery speaking state and TTS/browser fallback
  - prompt, timings and guidance
  - answer save + session advancement
  - streamed `/api/v2/practice-feedback` feedback
  - previous-answer feedback
  - completion flow
- `src/app/session/[sessionId]/PracticeVoiceRecorder.tsx`
  - recording and transcription logic
- existing Shadcn primitives
- existing V2 dark/light tokens, borders, radii, typography and iconography
- existing scoring and feedback payloads
- existing persistence and server actions

### RECOMPOSE / LIGHT RESTYLE

- progress/header hierarchy
- Avery/question stage
- prompt typography by question length
- timing/listen/guidance priority
- recorder placement and visible states
- live feedback presentation
- mobile spacing and safe-area behaviour

### CREATE NEW ONLY IF NEEDED

New components are justified only for a genuinely new interaction pattern, e.g. a compact feedback checkpoint or a mobile secondary-content Sheet. Do not duplicate state or backend logic.

The primary remaining issue is composition and hierarchy, not missing functionality.

---

# Phase 1 — Practice stage hierarchy

## Objective

Make the active Practice screen feel like a single interview stage rather than a vertical sequence of functional sections.

Target hierarchy:

1. compact progress / navigation
2. Avery state
3. current question
4. primary answer control
5. timing, Listen and guidance as secondary support

## 1. Compact the top chrome

- keep Back navigation and progress
- reduce dead mobile vertical space
- keep `Question X of Y` primary and saved count secondary
- keep `End practice` secondary

## 2. Make Avery + question one visual stage

Avery, current question and answer state should read as one composed scene. Avoid visually separating each item into its own card/section unless necessary.

## 3. Responsive question typography

Long technical questions currently dominate mobile.

Use prompt-length-aware sizing:

- short: large
- medium: default
- long: smaller + tighter line height

Do not hide meaningful question content by default.

## 4. Guidance becomes optional support

- collapsed by default
- visually lower priority
- expanding it should not permanently destroy stage composition
- use an inline controlled region first; consider a Sheet/Drawer on small screens only if testing shows it is cleaner

## 5. Recorder becomes the primary action

The visible UI should clearly distinguish:

- ready
- listening/recording
- transcribing
- answer saved
- evaluating
- feedback ready

Preserve the existing underlying recorder/transcription infrastructure.

## Acceptance criteria

- remains recognisably current InterviewGrade V2
- no new design system or colour language
- materially less dead space on mobile
- answer action is the clearest interactive target
- long prompts do not overwhelm the viewport
- secondary actions stay accessible without competing with the interview task

---

# Phase 2 — Feedback checkpoint

## Objective

Turn live feedback from another page section into a short coaching moment.

Immediate state:

- `Answer saved`
- `Analyzing…`

Then a compact checkpoint:

- score / qualitative status
- 1–2 strengths
- 1 improvement focus
- primary `Next question` action

Detailed feedback remains available in the report and may be expanded in Practice when useful.

## Reuse

- current SSE stream
- current `Feedback` payload
- previous-feedback state
- current asynchronous next-question preparation

## Guardrail

Do not force the user to wait for full feedback when the next question is already prepared.

---

# Phase 3 — Mobile Practice pass

## Objective

Make mobile intentionally composed rather than a narrowed desktop page.

Target order:

- Back
- question count + progress
- Avery + state
- question
- prep / response / Listen
- microphone / recording state
- guidance secondary
- feedback checkpoint replacing/overlaying the response area when appropriate

Requirements:

- minimise normal page scrolling during the active answer flow
- keep answer controls one-hand reachable
- respect safe-area and mobile browser chrome
- avoid large blank regions
- avoid primary CTA below the fold where possible
- preserve long-question readability

---

# Phase 4 — Dashboard hierarchy

## Objective

Move the candidate dashboard from analytics-first toward coaching-first without a major redesign.

Recommended hierarchy:

1. `New Practice` / continue action
2. `Your next focus` coaching card
3. recent / continue Practice
4. score trend
5. secondary stats: completed, average, best, in progress

The dashboard should answer: **What should I practice next?**

---

# Phase 5 — Practice creation simplification

Primary setup paths should be obvious:

- Generate with AI
- Upload material
- Build manually

Then quickly surface existing Practices, templates or suggested roles.

Target flow: `Dashboard -> New Practice -> Start` with as few unnecessary decisions as possible.

---

# Phase 6 — Landing-page product story

Keep the existing brand and hero direction, but make the page more product-led.

After the hero:

1. **Create a Practice** — short copy + real product screenshot
2. **Interview with Avery** — short copy + immersive Practice screenshot
3. **Improve with structured feedback** — short copy + report screenshot

Borrow step-based clarity, not another startup's visual branding.

---

# Phase 7 — Report refinement

The report has already received substantial V2 work, so keep this light until the Practice loop is finished.

It should answer in this order:

1. How did I do?
2. What am I good at?
3. What should I practice next?

Keep overall score, strengths, improvement focus, competency breakdown and question detail. Push secondary prose behind progressive disclosure where appropriate.

---

# Phase 8 — Avery interaction polish

Keep Avery minimal. Do not introduce a large avatar system.

Refine state communication only:

- speaking ring
- listening pulse
- processing state
- subtle waveform
- smoother transitions

Motion communicates state; it should not decorate the screen.

---

# Implementation sequence

## PR 1 — Practice stage hierarchy

- compact top area
- responsive question sizing
- Avery/question hierarchy
- guidance priority
- recorder positioning/state emphasis
- no backend changes

## PR 2 — Feedback checkpoint

- compact score/insight state
- clearer async feedback states
- continue immediately when next question is prepared
- previous-feedback access

## PR 3 — Mobile Practice polish

- one-screen composition refinement
- safe-area/browser-height fixes
- long-question behaviour
- secondary-content treatment

## PR 4 — Dashboard + Practice entry polish

- coaching-first dashboard hierarchy
- simpler creation entry points
- reduce in-app explanatory density

## PR 5 — Landing-page product story

- product-led 3-step story
- stronger screenshots
- reduced copy density
- preserve current branding

Report/Avery micro-polish follows only where testing shows a clear need.

---

# Guardrails

Do not combine this work with:

- a new design system
- colour rebrand
- new component library
- database/schema changes
- scoring changes
- prompt/model/provider changes
- AI Coach work
- MediaPipe/body-language work
- employer-side redesign
- broad dashboard rewrite
- native mobile app work
- unnecessary animation dependencies

Prefer reuse, recomposition and light restyling.

## Product success criterion

> InterviewGrade keeps the clean V2 SaaS shell, but active Practice feels like being inside a training experience rather than navigating a collection of forms and cards.

The interface should get out of the user's way, keep the interview task visually dominant, and reveal coaching intelligence only when useful.