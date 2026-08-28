# V2 Practice Session — Clean Stage Reset

## Decision

Rebuild the active Practice presentation from the stable V2 session controller instead of reshaping the old question-card + camera-card + feedback-card layout.

The #166 experiments were useful for validating interaction ideas, but not as a base implementation. They proved that camera-free/microphone-first Practice is viable, while also showing that incremental CSS/layout overrides leave detached controls, dead space, and brittle selectors.

## Keep

The following existing behavior remains authoritative and should be reused, not duplicated:

- `V2SessionPlayer` session orchestration and question state
- question ordering/progress
- OpenAI TTS + browser speech fallback
- `savePracticeSessionResponseAction`
- `advancePracticeSessionAction`
- `completePracticeSessionAction`
- feedback SSE via `/api/v2/practice-feedback`
- rubric mapping/scoring payloads
- final-question completion remaining unblocked by live feedback
- MediaRecorder + Whisper transcription + browser transcript fallback
- existing report, persistence and database structures

## Drop from the active V2 presentation

- permanent camera/self-view
- camera permission in the normal Practice path
- a dedicated camera/video card
- a separate giant recorder panel
- permanent stacked question/recorder/feedback cards
- broad `:has()` selectors used to reconstruct page layout
- utility-class selectors that depend on exact Tailwind class strings
- floating `End practice` placement caused by spare flex height
- repeated instructional copy during every question

## New presentation boundary

The active interview should be one centered stage:

```text
SessionProgress
    ↓
AveryPresence
    ↓
QuestionPrompt
    ↓
Guidance + Timing + Listen
    ↓
InteractionSlot
    ├── VoiceRecorder
    ├── Processing
    └── Feedback
```

`InteractionSlot` is important: recording and feedback are states of the same interaction surface. They do not stack as two permanent panels.

## Component responsibilities

### `V2SessionPlayer`
Owns orchestration only:

- active question
- saved response count
- TTS state
- answer persistence
- feedback request lifecycle
- next/finish transitions

### `PracticeVoiceRecorder`
Owns response capture only:

- microphone-only media acquisition
- microphone permission/error state
- MediaRecorder
- browser speech recognition fallback
- waveform
- elapsed recording time
- transcription
- transcript callback

It does **not** save responses, request feedback, advance questions, calculate scores, or complete sessions.

### Active stage
The stage owns composition, not business logic:

- Avery visual presence
- question typography
- Listen/guidance/timing affordances
- one primary response control
- feedback replacing the response interaction after capture
- compact previous-feedback affordance on the next question

## Current implementation on #168

The clean recorder is now integrated into the active session stage.

The new preview should show:

- one centered stage rather than separate question/camera/feedback cards
- Avery promoted above the question
- microphone-only response capture
- waveform + one record/stop control in the stage
- no self-view/camera request
- feedback replacing the recorder after the answer is saved
- Next/Finish attached to the feedback state
- previous-question feedback reduced to a compact expandable row
- End practice in the progress chrome rather than floating in spare page space

## Desktop target

- centered content around 700–900px
- one dominant stage
- no normal page scroll for typical questions/states
- progress and End practice peripheral
- no giant empty areas created by viewport-height flex containers

## Mobile target

Validate specifically at `390×844`:

- no horizontal overflow
- Avery/question readable without camera competing for height
- record/stop thumb-reachable
- long guidance expands intentionally
- feedback and Next/Finish remain reachable
- normal question interaction should fit within the viewport where practical

## Acceptance criteria

Merge only if the preview clearly beats the stable pre-experiment session on both desktop and mobile.

Must preserve:

- recording/transcription reliability
- saved response flow
- question progression
- TTS/listen behavior
- feedback streaming
- final-question finish behavior
- report generation/persistence

Reject the direction if it requires new layout hacks to hide structural problems.
