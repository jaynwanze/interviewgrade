# InterviewGrade V2 UI/UX checkpoint — 2026-09-02

This checkpoint records the accepted state after the Practice-session UI/UX polish work on 2026-09-02. It supplements `docs/UI_UX_PRODUCT_POLISH_PLAN.md` and should be treated as the source of truth before continuing UI work.

## Accepted product direction

InterviewGrade keeps the existing V2 visual identity and Shadcn foundation. The goal remains to make active Practice feel like a focused training experience rather than a stacked SaaS page, but changes must preserve proven layouts instead of repeatedly reworking them.

## Desktop Practice — frozen baseline

The current approved desktop Practice composition is the baseline.

Keep unchanged unless a future issue is isolated and demonstrated:

- desktop outer glass shell geometry
- vertical stage anchor
- progress-row positioning
- Avery/question composition
- compact recorder footprint
- current desktop feedback density and two-column treatment where present
- existing V2 colours, borders, radii, typography and Shadcn primitives

### Regression history

PR #213 (`refactor: sharpen Practice stage hierarchy`) initially changed desktop geometry and recorder footprint. Visual testing showed that the prior desktop composition was better. The desktop geometry changes were reverted, and PR #215 restored the recorder to the known-good pre-#213 implementation.

PR #215 (`fix: restore approved Practice recorder footprint`) was merged. This is part of the accepted desktop baseline.

### Known desktop issue — deferred

There is still a visible jump / footprint change around the transition from the answer state into evaluating / loaded feedback on desktop.

PR #217 (`fix: stabilize desktop feedback transition`) attempted to reserve a fixed lower feedback region. Visual testing showed the jump was still present, so #217 was closed without merge.

Do not continue adjusting desktop shell geometry to solve this. When revisited, investigate the exact recorder -> evaluating -> feedback DOM/layout transition and stabilize only the changing lower interaction region. Preserve the approved outer shell and top stage anchor.

## Mobile Practice — accepted checkpoint

PR #216 (`fix: stabilize mobile Practice stage`) was visually validated on iPhone Safari and merged.

Root cause fixed:

- mobile CSS previously centered the Practice module only while `[data-practice-voice-recorder]` existed
- submitting an answer removed the recorder
- the selector stopped matching and the parent switched alignment, causing progress/Avery/question to jump

Accepted behaviour now:

- one stable mobile anchor across answering and feedback states
- progress/Avery/question remain in the same physical position when feedback mounts
- feedback uses the lower region and may scroll internally
- no desktop geometry changes were included in #216

Merge commit for #216: `78f03ecdedda8b9401b65faf6daedbc0f0215f5d`.

## Global mobile density / zoom issue — open

On iPhone Safari, the app can still feel slightly too large at the browser's default zoom. The user had to zoom out to get the preferred full-app density.

This appears broader than the Practice screen and should be handled as a separate global responsive audit rather than by adding more Practice-specific CSS.

Future audit should inspect:

- root/mobile font sizing
- page-level horizontal padding
- fixed/min widths
- component density at native iPhone scale
- viewport and safe-area handling
- whether any global styles encourage horizontal oversizing

Do not use browser zoom as the product solution; the app should feel correctly scaled at default mobile zoom.

## PR outcomes from this session

- #212 — UI/UX product polish plan: documentation baseline
- #213 — Practice stage hierarchy: merged after desktop geometry was restored; later desktop recorder regression corrected
- #215 — restore approved Practice recorder footprint: merged and accepted
- #216 — stabilize mobile Practice stage: merged and accepted
- #217 — desktop feedback stability experiment: closed without merge; not accepted

## Next UI work order

1. Leave the current Practice desktop/mobile baseline alone unless testing finds a concrete blocker.
2. Run a separate global mobile density/responsive audit for the default-zoom issue.
3. Revisit desktop feedback-transition stability later with instrumentation/DOM-state comparison, not shell repositioning.
4. Continue the broader product-polish plan only after those baseline issues are understood:
   - feedback checkpoint interaction
   - coaching-first dashboard hierarchy
   - Practice creation simplification
   - product-led landing-page story
   - report/Avery micro-polish only where testing justifies it

## Guardrail for the next session

Do not restart broad Practice layout experimentation. Begin from the screenshots and merged state accepted on 2026-09-02. Prefer small isolated changes with preview validation on both desktop and iPhone Safari before merge.
