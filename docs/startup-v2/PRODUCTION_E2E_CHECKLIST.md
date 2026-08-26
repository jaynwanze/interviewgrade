# InterviewGrade V2 Production E2E Checklist

Use this checklist for the final production pass after UI changes. The automated Playwright critical path covers the deterministic local flow; this list captures the production-only checks that still need real browser, media, auth, network, and deployment behavior.

## Core candidate flow

- Sign in on `interviewgrade.io` and confirm Dashboard loads without a blank/frozen transition.
- Open **My Practices** and confirm cards/actions are readable on desktop and mobile.
- Create a manual Practice with at least 3 questions and publish it.
- Start the Practice from the published share/run flow.
- Grant camera + microphone access and confirm the live camera and glass controls appear.
- Record and submit Q1; confirm the response is acknowledged immediately and feedback can arrive without blocking navigation.
- Continue to Q2/Q3 and confirm question progress, Avery/Listen, camera, controls and feedback remain inside the intended viewport.
- On the final question, confirm **Finish practice** is available after the response is saved even if live feedback is still evaluating.
- Finish and confirm navigation reaches the generating-report state and then the final report.

## Report

- Overall score and score band are visible immediately.
- Rubric performance is scan-first and does not horizontally overflow.
- Strengths and Focus next are concise in the first view.
- Recommended next step is visible before detailed response review.
- Response review remains readable; long prompts wrap instead of pushing scores out of cards.
- **Your response** details expand/collapse correctly.
- **How scoring works** expands/collapses correctly.
- Export PDF completes and preserves full report detail.

## History + navigation

- Completed session appears in History with score/status.
- Opening the report from History reaches the same persisted report.
- Back/session/dashboard navigation shows immediate route progress/loading feedback.
- Repeat a dashboard → practices → history → report navigation after an idle period to check cold-start perception.

## Mobile viewport

- Test iPhone-class portrait width (~390 px).
- No normal page-level horizontal scrolling on Dashboard, My Practices, session or report.
- Session question text remains readable and intentionally bounded.
- Camera remains useful without pushing feedback/actions off screen.
- Feedback has intentional internal scrolling when needed rather than forcing the whole session to grow.
- Report actions, score, rubric rows and detailed question cards fit the viewport.

## Desktop viewport

- Session remains a focused single-stage layout rather than reverting to the old bulky two-column dashboard.
- Report score summary + rubric performance balance correctly across the first row.
- Long response-review prompts do not push scores outside their card.
- No accidental fixed/absolute positioning collapses the main content into a corner.

## Production-only behavior

- Test one fresh/cold navigation path on Vercel Hobby deployment.
- Confirm real TTS works; if provider TTS fails, browser fallback is usable.
- Confirm real transcription completes and the saved transcript is reflected in feedback/report evidence.
- Confirm refresh/reopen of a completed session preserves the report.
- Confirm no unexpected console/runtime errors during camera, transcription, feedback or report generation.

## Release rule

Treat session/report layout breakage, lost responses, blocked final completion, missing persisted reports, broken media controls, or unusable mobile overflow as release blockers. Minor spacing/copy polish can be deferred.
