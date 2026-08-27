# Avery audio-first session plan

## Decision

Move the active Practice session to an **Avery-first, audio-first** composition and hide the permanent camera preview from the primary experience.

This is a presentation refactor, not a new interview engine. The existing session state, media pipeline, transcription, TTS, persistence, feedback streaming, scoring and report flow stay in place.

The visual direction should combine:

- the **InterviewGrade landing-page language** for brand, spacing, gradients and Avery presence;
- a **focused voice-conversation interaction model** for the active interview;
- the **current V2 session behavior** underneath so no working infrastructure is duplicated.

Do not copy the landing page literally and do not imitate ChatGPT literally. The product identity should come from **Avery + question + voice state + coaching transition**.

## Why this solves the current problem

The permanent webcam currently creates most of the layout pressure. It consumes vertical space, forces question/feedback sections to resize around it, makes long prompts harder to fit on mobile and makes desktop feel closer to a video-call interface than an AI interviewer.

Hiding the camera preview gives the session one clear focal hierarchy and makes desktop/mobile easier to keep within a normal viewport.

## Reuse — do not rebuild

Keep the existing implementations for:

- session/question/progress state;
- Avery and speaking rings;
- TTS and browser fallback;
- prep and response timing;
- microphone capture / MediaRecorder;
- waveform state and audio feedback;
- transcription;
- response persistence;
- feedback SSE / progressive feedback;
- Next question / Finish practice behavior;
- report generation and scoring.

Do **not** delete the camera/media code in the first PR. Stop presenting the webcam preview as part of the normal session UI while preserving the underlying working media path. This keeps a future optional camera/body-language feature possible without another media rewrite.

## Primary composition

The active session becomes one centred stage rather than a stack of independent dashboard cards.

```text
┌──────────────────────────────────────────┐
│ InterviewGrade                   2 of 5  │
│                                          │
│                  AVERY                   │
│          speaking / listening state      │
│                                          │
│   Tell me about a time you had to        │
│   resolve a difficult conflict.          │
│                                          │
│             Listen again                 │
│                                          │
│           ~~~ waveform ~~~               │
│                                          │
│             Record answer                │
│                                          │
│       Prep 00:30      Answer 02:00        │
└──────────────────────────────────────────┘
```

The question should be the dominant text. Avery should be visually important enough to communicate speaking/listening state, but not so large that long questions lose room.

## Session states

### 1. Avery speaking

- Avery speaking rings/animation active.
- Question remains visible.
- Record control unavailable only while needed, with a clear visual reason.
- Listen again remains secondary.

### 2. Ready to answer

- Avery settles to a calm idle state.
- Primary CTA is `Record answer`.
- Prep/response timing stays compact and peripheral.
- Guidance is available on demand rather than permanently competing with the question.

### 3. Recording

```text
                 AVERY
          subtle listening state

        ~~~~~ LIVE WAVEFORM ~~~~~

                00:38

            Finish answer
```

- No camera box.
- Waveform, elapsed time and stop/finish action become the main interaction.
- Recording state must be unmistakable without needing explanatory prose.

### 4. Processing

Use the existing latency states, but present them inline:

`captured → transcribing/saving → evaluating → first useful insight → complete`

- immediately acknowledge that the answer was captured;
- keep the question context visible;
- avoid full-screen spinners;
- show first useful feedback as soon as it exists.

### 5. Feedback checkpoint

Do not replace the entire screen with a new dashboard. Keep the question context and reveal a concise coaching layer beneath the interaction area.

```text
✓ Answer captured

72  Good foundation

Strength
Clear situation and ownership

Improve
Make the outcome more measurable

                         Next question
```

Default feedback should be short and scanable. Existing richer feedback can remain available through progressive disclosure where useful.

## Desktop behavior

- centred content stage, approximately `700–850px` wide;
- no persistent sidebars or two-column video layout;
- no permanent camera preview;
- question + Avery + voice controls dominate;
- progress and timing are compact/peripheral;
- secondary guidance/detail may use Sheet/Popover/Disclosure;
- normal active use should not require page scrolling.

## Mobile behavior

- one primary viewport, not a compressed desktop layout;
- Avery roughly `80–110px` visual height depending on state;
- question gets the majority of available reading space;
- long questions scroll/clamp inside a controlled question region rather than forcing page overflow;
- waveform and primary action are thumb reachable;
- prep/response timing stays compact;
- feedback appears inline or via bottom sheet where needed;
- account for safe areas/browser chrome;
- normal interaction should not page-scroll.

## Visual language

Use the current V2 tokens/Shadcn primitives. No new design system.

Borrow from the landing page only where it strengthens identity:

- calm background treatment / subtle gradient;
- generous whitespace;
- Avery as the branded focal presence;
- softer containers and fewer visible borders;
- restrained motion tied to actual session state.

Avoid:

- card soup;
- giant decorative avatar treatment;
- floating webcam/self-view;
- broad `:has(...)` selectors or fragile CSS that can accidentally reposition the whole session;
- permanent transcript/guidance panels;
- another architecture rewrite.

## Implementation shape

Prefer explicit presentation components/classes rather than another CSS-only transformation.

Suggested presentation pieces:

- `InterviewFocusShell`
- `AveryPresence`
- `QuestionStage`
- `VoiceInteraction`
- `InterviewProgress`
- `InsightCheckpoint`

These should consume the existing `V2SessionPlayer` state/handlers rather than own duplicate orchestration.

The first implementation PR should remain intentionally small:

1. hide/remove the rendered camera preview from the normal Practice session;
2. recompose Avery, question, waveform and controls into one explicit centred stage;
3. keep all recording/transcription/persistence/TTS/feedback handlers unchanged;
4. preserve current final-question completion behavior;
5. keep feedback concise and in-flow;
6. verify desktop and 390×844 mobile without horizontal overflow or normal page scroll.

## Explicit non-goals for PR 1

- do not delete `UserCamera`/MediaRecorder infrastructure;
- do not add body-language analysis;
- do not redesign the report;
- do not change scoring or prompts;
- do not change answer persistence or feedback APIs;
- do not add realtime voice infrastructure;
- do not redesign unrelated dashboard/history/practice pages.

## Acceptance criteria

The PR is successful when:

- the session still behaves exactly like the current working Practice flow;
- Avery/question/voice interaction are the visual focus;
- there is no permanent webcam preview in the normal session;
- desktop no longer reads as a video-call/dashboard layout;
- mobile feels intentional at 390×844 and does not horizontally overflow;
- recording, transcription, feedback, Next and Finish still work unchanged;
- no broad selector regression can collapse/reposition the full session shell;
- the experience remains recognisably InterviewGrade V2 rather than a generic ChatGPT clone.
