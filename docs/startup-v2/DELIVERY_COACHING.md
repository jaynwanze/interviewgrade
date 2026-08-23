# InterviewGrade Delivery Coaching Roadmap

Status: **planned after current launch-hardening work**

This document defines the intended sequence for improving spoken-delivery coaching and, later, optional visual-delivery feedback in InterviewGrade.

The sequence is deliberately incremental:

1. objective speech metrics from data InterviewGrade already has;
2. an opt-in browser-only pose/framing prototype;
3. server-side computer-vision tooling such as Supervision only if the browser prototype proves useful and needs capabilities that cannot be delivered simply in-browser.

The goal is better coaching, not automated personality or emotion judgement.

## Current baseline

The current V2 Practice flow already provides:

- browser microphone/camera acquisition with microphone-only fallback;
- browser-native audio recording;
- server-side transcription;
- persisted response text;
- rubric-based immediate feedback;
- final rubric-weighted reports;
- Avery TTS with browser speech fallback;
- responsive participant flow through the shared Practice, session, feedback and report path.

The current recorder intentionally persists/processes the spoken answer as audio/transcript data rather than building a video-analysis pipeline. That is the right baseline to preserve while delivery coaching is validated.

---

# Phase 0 — Finish launch hardening first

Before adding new delivery-analysis product surface, close the remaining high-value reliability work from the main roadmap.

Priority items:

- critical-path E2E coverage for creator → publish → shared Practice → answer → feedback → finish → report → creator result;
- cover the final-question/Q5 completion edge case in that E2E path;
- perform the documented Supabase migration-history repair bookkeeping without rerunning migration DDL;
- continue small production-polish fixes only when a concrete issue is observed.

Delivery coaching should not reopen the core scoring model or block the current Practice loop.

---

# Phase 1 — Better speech metrics

Priority: **next delivery-coaching experiment**

This is the lowest-complexity, highest-signal addition because it can use the transcript plus recording duration and does not require raw video analysis.

## First slice

Capture and report objective per-answer metrics such as:

- answer duration;
- word count;
- speaking pace in words per minute;
- simple filler count/rate for low-ambiguity fillers such as `um`, `uh` and `erm`;
- unusually short or unusually long answer indication when useful for the Practice context.

Do not let these metrics silently alter the creator-defined rubric score in the first version. They should appear as a separate **Delivery** or **Speaking** coaching section.

Example result shape:

```text
Speaking

Duration          01:24
Words             176
Pace              126 wpm
Filler words      4
Filler rate       2.3 / 100 words
```

## Implementation boundary

Prefer a small structured capture result rather than making the evaluator infer timing from transcript text:

```text
AnswerCapture
  transcript
  recordingDurationMs
```

Derived metrics should be deterministic application logic.

Conceptually:

```text
browser recorder
  → transcript + duration
  → deterministic speech-metric calculator
  → persisted small metric payload
  → immediate/final Delivery UI
```

Keep provider-specific transcription logic behind the existing transcription boundary.

## Later speech metrics

Only add these when the data source is reliable enough:

- pause count / long-pause duration;
- cadence variation;
- repeated phrase/opening detection;
- answer-to-question speaking-time trends;
- session-level pace consistency.

Pause metrics need reliable timing information. Do not invent them from plain transcript text. Add word/segment timestamps or a local audio timing signal only when the extra complexity is justified.

## Speech-metric guardrails

- Treat WPM/fillers as coaching signals, not universal measures of interview quality.
- Do not punish accents or dialects.
- Avoid counting ambiguous discourse words such as `like` as fillers without context.
- Keep the creator rubric as the source of truth for content/competency scoring unless a future Practice explicitly includes delivery criteria.
- Preserve a usable experience when recording metadata is unavailable.

## Phase 1 acceptance

Phase 1 is useful when:

1. duration is captured reliably for a spoken response;
2. WPM and basic filler metrics are deterministic and unit-tested;
3. metrics persist/reload with the response or evaluation result;
4. the participant can understand what the numbers mean;
5. missing metrics never break feedback/report generation;
6. the metrics do not change the existing rubric score by default.

---

# Phase 2 — Browser-side pose/framing prototype

Priority: **after speech metrics are useful in real sessions**

Use a browser computer-vision library such as MediaPipe directly against the live camera stream.

The prototype should be local-first:

```text
Camera
  ↓
MediaPipe Face/Pose Landmarker
  ↓
local browser aggregation
  ↓
small metric JSON
  ↓
InterviewGrade Delivery feedback
```

The raw video should not need to leave the browser for this first experiment.

## Useful first signals

Prefer directly observable camera/framing signals:

- face detected / face-present percentage;
- face comfortably inside frame percentage;
- repeated exits from frame;
- approximate head-position stability;
- shoulder/framing stability where pose landmarks are reliable;
- camera availability / analysis coverage.

Keep the first version conservative. A small number of robust metrics is better than a large set of pseudo-precise scores.

## Suggested processing model

- analyse the existing live camera stream;
- sample/throttle frames rather than processing every rendered frame;
- aggregate counters/statistics locally during the answer;
- discard per-frame landmarks after aggregation;
- send/persist only the compact summary needed for coaching;
- allow the Practice to continue normally when camera analysis is unsupported, disabled or too slow.

## Product placement

Initial visual-delivery feedback should be:

- opt-in;
- Practice/coaching focused;
- clearly separate from rubric/content scoring;
- explainable in plain language.

Example:

```text
Visual delivery

Face in frame       96%
Left frame          1 time
Framing stability   Stable
Analysis coverage   91%
```

Use wording such as:

> You moved outside the camera frame once during this answer.

Do not convert the same signals into claims such as:

> Confidence: 63%

## Explicit visual-analysis non-goals

Do not infer or score:

- confidence;
- nervousness;
- honesty/trustworthiness;
- personality;
- emotion or sentiment from facial movement;
- attractiveness;
- protected/sensitive traits.

Do not use visual-delivery metrics to rank candidates for employer screening in the initial product.

## Phase 2 acceptance

The browser prototype is worth keeping only if:

1. it works on the supported participant browsers without materially degrading recording/TTS/session UX;
2. camera-off and camera-unavailable paths remain fully usable;
3. raw frames/video are not uploaded or stored for the feature;
4. the reported metrics are stable enough to be understandable across repeated runs;
5. users find the feedback useful rather than distracting;
6. there is a clear privacy explanation and an easy opt-out.

---

# Phase 3 — Supervision / server-side vision service

Priority: **deferred until Phase 2 proves a real need**

Roboflow Supervision is a Python computer-vision toolkit around model outputs. It can help with detections, keypoints, tracking, smoothing, video processing and annotation, but it is not itself the model that decides posture or body-language meaning.

InterviewGrade should introduce a Python/Supervision service only if validated product requirements need capabilities such as:

- more robust temporal tracking than the browser prototype can provide;
- offline analysis of uploaded/recorded media that users explicitly choose to submit;
- interchangeable pose/detection models;
- advanced smoothing/track association;
- internal model evaluation tooling;
- richer annotated debugging during development.

Conceptual future architecture:

```text
InterviewGrade web app
  ↓
explicitly submitted media / sampled frames
  ↓
Python vision service
  ├── pose/detection model
  ├── Supervision tracking/smoothing
  └── deterministic metric aggregation
  ↓
small explainable metric payload
  ↓
InterviewGrade report
```

Do not add this service merely because Supervision exists. It adds a second runtime, deployment surface, compute cost, privacy/storage decisions and failure modes.

## Phase 3 trigger

Only start Phase 3 when at least one of these is true:

- the browser prototype is demonstrably useful but technically limited;
- a real customer workflow requires offline/server analysis;
- model experimentation requires a common tracking/evaluation layer;
- the added infrastructure has a clear product benefit that outweighs its cost.

---

# Scoring policy

Delivery coaching and competency scoring are separate by default.

```text
Rubric score
  → creator-defined competency/content criteria

Delivery coaching
  → speech/framing observations
```

A future creator may explicitly add a rubric criterion such as `Verbal clarity` or `Presentation delivery`. If that happens, the normal rubric model should still define the score. Generic hidden delivery heuristics must not silently override rubric weights.

---

# Privacy and retention policy

Prefer the minimum data needed for useful coaching.

Initial direction:

- speech: persist transcript and compact derived metrics under existing response/evaluation retention rules;
- browser vision: aggregate locally and persist only compact summary metrics;
- do not store raw video for the Phase 2 prototype;
- do not introduce biometric identification or face recognition;
- provide clear participant-facing disclosure before visual analysis;
- keep the feature optional when camera use is not necessary for the Practice.

If raw video storage is ever introduced later, it requires an explicit retention/deletion policy and should be treated as a separate product/privacy decision.

---

# Current priority order

| Area | Current status | What remains |
| --- | --- | --- |
| V2 production/core UX | **Shipped for current product scope** | Critical E2E, migration-history repair, evidence-driven polish |
| Better speech metrics | **Next delivery experiment** | Duration/WPM/fillers first; pause timing later |
| Browser pose/framing | **Planned later** | Opt-in MediaPipe prototype, local aggregation, privacy UX |
| Supervision service | **Deferred** | Only after browser validation exposes a real server-side need |

This ordering intentionally keeps the reliable Practice loop ahead of speculative multimodal infrastructure.
