# V2 Practice Session — Clean Stage Reset

## Decision

Do not continue building on PR #166. The camera-free experiment validated the product direction, but not the presentation structure.

The next implementation starts from `master` and keeps the proven session infrastructure while replacing the active-session presentation deliberately.

## Product goal

The active Practice session should feel like one focused AI interview stage, not a stack of dashboard cards.

The user should be able to understand the current state at a glance:

`question ready → recording → transcribing/saving → evaluating → feedback → next/finish`

Only the information needed for the current state should dominate the viewport.

## Keep

Reuse without redesigning the underlying behavior:

- `V2SessionPlayer` orchestration and session state
- question/progress logic
- Avery TTS and browser voice fallback
- answer persistence actions
- transcription path and browser transcript fallback
- feedback SSE/API
- scoring payloads and report generation
- next/final-question behavior
- existing V2 Shadcn/tokens
- existing speaking-ring animation asset

From the #166 experiment, keep these product decisions:

- V2 Practice is microphone-first and does not need a permanent self-view
- request microphone-only media for the normal V2 Practice path
- one primary record/stop action at a time
- waveform is useful while the user is speaking
- explicit `Ready`, `Listening`, `Transcribing`, `Evaluating` states are useful

## Drop

Do not carry forward:

- permanent camera card
- giant empty recorder panel
- separate card for question, recorder and feedback during every state
- layout changes driven by broad `:has()` selectors
- utility-class selector hacks that reshape `UserCamera`
- floating `End practice`
- repeated instructional copy under the microphone
- large reserved viewport height just because the old layout contained video

## Clean presentation structure

```text
PracticeSession
├── SessionProgress
├── InterviewStage
│   ├── AveryPresence
│   ├── QuestionPrompt
│   ├── Guidance
│   ├── Timing
│   └── InteractionSlot
│       ├── VoiceResponse        (before answer)
│       ├── ProcessingState      (saving/transcribing/evaluating)
│       └── FeedbackState        (after answer)
└── SessionActions
```

The important rule is that `VoiceResponse`, `ProcessingState`, and `FeedbackState` share one interaction slot. They do not stack into three permanent sections.

## Desktop target

- centred stage, roughly 720–860px useful content width
- no sidebar
- no camera rectangle
- compact progress at the top
- `End practice` belongs in the progress/header chrome
- Avery is visually recognisable but not enormous
- question is the dominant text
- guidance and timing remain secondary
- voice interaction sits immediately under the question
- normal use should not need page scrolling

Conceptually:

```text
Question 3 of 5  ━━━━━━━━━━━━━━━━━━━━━  End

                 Avery
              Interviewer

      Tell me about a time you...

        Prep 30s · Response 120s
             Show guidance

             ▂▃▅▆▅▃▂
                  ●
          Ready when you are
```

After capture, the lower interaction slot transforms:

```text
             ✓ Answer saved

               78 / 100
             Good response

       Clear structure and ownership

       Improve: quantify the result

              Next question →
```

## Mobile target

At 390×844:

- one viewport, no horizontal layout
- compact progress/header
- Avery + question use the upper half
- voice control stays thumb-reachable without being fixed over content
- long prompts get a bounded reading region only when necessary
- feedback replaces the response interaction rather than pushing the whole page downward
- intentional sheets/details may scroll; normal active interaction should not

## New recorder boundary

Do not visually repurpose `UserCamera` for V2 Practice.

Introduce a dedicated `PracticeVoiceRecorder` presentation component that owns only:

- microphone acquisition
- MediaRecorder lifecycle
- browser speech-recognition fallback
- waveform
- record/stop state
- transcription
- returning the final transcript through `onAnswer`

It must not own:

- question progression
- answer persistence
- feedback fetching
- scoring
- session completion
- report navigation

The legacy `UserCamera` remains available for old/non-V2 flows.

## Implementation sequence

### PR 1 — clean recorder boundary

- add `PracticeVoiceRecorder`
- microphone-only
- reuse existing media/transcription utilities
- no active-session route switch yet unless the stage integration is ready in the same PR

### PR 2 — explicit InterviewStage composition

- move the active JSX into explicit stage/presentation components
- integrate `PracticeVoiceRecorder`
- put End in header/progress chrome
- one interaction slot for recording/processing/feedback
- remove old video-card layout from the V2 Practice path

### PR 3 — mobile + state polish

- 390×844 validation
- long question behavior
- feedback transition/density
- reduced motion/accessibility pass

## Acceptance criteria

Before merging the new stage:

- no camera permission requested in normal V2 Practice
- no camera/self-view rendered
- recording/transcription behavior still works
- saved-answer behavior is unchanged
- final-question completion remains unblocked by live feedback
- question TTS/fallback still works
- feedback SSE still works
- no broad selector hacks are required for layout
- desktop does not look like a dashboard/video call
- mobile feels intentionally composed
- no normal-session horizontal overflow
- active interaction fits without large unexplained dead areas

## Out of scope

- scoring changes
- rubric changes
- API changes
- database/schema changes
- report redesign
- employer flows
- body-language/camera analysis
