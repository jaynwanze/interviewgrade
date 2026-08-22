# InterviewGrade V2 Dashboard Vision

## Purpose

The V2 dashboard should be a focused progress surface for Practice sessions and rubric-based improvement.

It should not feel like the legacy candidate dashboard with V2 sections added on top. During the transition, legacy Mock Interview pages may remain available separately, but `/candidate/dashboard` should become a coherent V2 experience.

The core question the dashboard should answer is:

> How am I progressing, what should I practise next, and where can I continue?

---

## Target layout

```text
Your progress

Completed     Average     Best     In progress

Latest Practice / Continue Practice

Score trend

────────────────────────────────────────────

Performance profile

┌──────────────────────────┐  ┌──────────────────────────┐
│        Radar chart       │  │ Strongest area           │
│   dynamic rubric axes    │  │ Focus next               │
│                          │  │ Recommendation            │
└──────────────────────────┘  └──────────────────────────┘

Recent practices
```

This is the north-star layout, not a requirement to ship every block at once.

---

## 1. Progress summary

Keep the current V2 summary cards:

- Completed sessions
- Average score
- Best score
- In-progress sessions

These should be derived only from V2 Practice sessions and structured reports.

If there is no scored report yet, score cards should show a useful empty state rather than fabricated zeros.

---

## 2. Latest Practice / Continue Practice

The dashboard should immediately surface the most useful next action.

Priority:

1. If a session is in progress, show **Continue practice**.
2. Otherwise, if a completed Practice exists, show the latest completed Practice with **View report**.
3. Otherwise, show an onboarding action such as **Create practice** or **Start a practice**.

The dashboard should avoid making the user hunt through History to resume work.

---

## 3. Score trend

Keep the current V2 score trend concept.

Purpose:

- show improvement over repeated scored Practice sessions;
- make progress over time visible;
- provide a simple reason to return and practise again.

Rules:

- one report: show the point but clearly state that at least two reports are needed for a trend;
- two or more reports: connect scores chronologically;
- use final session scores from persisted V2 reports;
- do not mix legacy interview grades into the V2 series unless we intentionally build a separate migration/unified-history feature.

A line chart is the preferred visualization because order over time matters.

---

## 4. Performance profile

### Radar chart

The V2 radar chart is the conceptual replacement for the old fixed skill cards such as Adaptability, Conflict Resolution and Decision Making.

The axes must be dynamic rubric criteria from real Practice evidence, not a hard-coded skill catalogue.

Examples:

### DSA Practice

```text
Algorithmic correctness
Time and space complexity
Problem solving / communication
Pythonic implementation
```

### Sales Practice

```text
Discovery
Objection handling
Product knowledge
Communication
```

### Customer service Practice

```text
Empathy
Policy accuracy
De-escalation
Resolution quality
```

This keeps the dashboard compatible with the broader V2 product direction instead of rebuilding an interview-only skill system.

### Data sufficiency

Do not show a radar chart just because the component exists.

Recommended behavior:

- 0 scored reports: empty/onboarding state;
- 1 scored report: prefer the simpler Strongest area / Focus next cards;
- multiple scored reports with meaningful criterion evidence: enable the radar profile;
- if criteria differ heavily between unrelated Practices, avoid pretending they are directly comparable. Prefer a selected Practice/category scope or the most frequently evidenced criteria.

The radar chart should be an analytics enhancement, not decorative dashboard chrome.

---

## 5. Strongest area / Focus next / Recommendation

Keep the current V2 performance-focus concept.

This is more actionable than the legacy fixed skill cards.

The panel should show:

- strongest evidenced rubric criterion;
- lowest-scoring evidenced criterion;
- latest or aggregated recommendation;
- optional shortcut to the relevant report or another Practice.

The wording should remain grounded in persisted rubric evidence.

---

## 6. Recent practices

Add a compact recent activity section once the core dashboard is clean.

Suggested columns/cards:

```text
Practice              Status       Score      Date       Action
DSA Practice          Completed    78/100     22 Aug     View report
Sales Objections      In progress  —          21 Aug     Continue
Leadership Practice   Completed    72/100     18 Aug     View report
```

This can become the bridge between the dashboard and the fuller History page.

Do not turn the dashboard into a full data table or analytics warehouse.

---

## 7. Quick actions

Useful actions near the top or bottom of the dashboard:

- Create practice
- My practices
- View history

Potential future action:

- Upload document → Generate Practice

The dashboard should make the next meaningful action obvious without becoming a navigation duplicate.

---

# Legacy V1 reuse policy

## Reuse presentation patterns, not V1 analytics assumptions

V1 contains useful Recharts/shadcn chart implementations, including:

- line/bar chart patterns;
- radar chart implementation;
- radial chart implementation;
- chart tooltip/container styling.

These can be reused or adapted where they reduce implementation work.

However:

- remove hard-coded sample datasets;
- do not retain legacy interview-table queries just because an old chart expects them;
- do not recreate the fixed candidate-skill model in V2;
- feed reused visual components from V2 analytics services and rubric evidence.

The reusable asset is the **visual/component pattern**, not the old domain model.

---

# Lottie / animation policy

V1 also contains useful animation assets. Reuse them where animation communicates state or gives InterviewGrade personality.

Recommended:

- `AnimationSpeakingRings.json` → Avery speaking/listening experience;
- `AnimationWelcome.json` → optional first-time or empty-state onboarding;
- `AnimationReport.json` → optional report-generation/completion state;
- `AnimationGo.json` → optional create/start Practice empty state.

Avoid continuous decorative animation on the normal analytics dashboard.

The dashboard should feel calm, trustworthy and useful. Avery/session interactions are the better place for personality and motion.

---

# What leaves the dashboard

Remove the legacy dashboard block containing concepts such as:

- `Candidate Dashboard` heading;
- `6 Skills Found`;
- search over fixed legacy skills;
- Adaptability / Conflict Resolution / Decision Making cards;
- Practice Mode toggle tied to legacy templates;
- Tip of the Day as a large dashboard section.

These belong to the previous product model and make the current page look like two products stitched together.

Legacy Mock Interview functionality can remain reachable through its own sidebar/page while the migration is incomplete.

---

# Naming direction

Preferred V2 language:

- **Dashboard** or **Your progress**, not Candidate Dashboard;
- **History**, eventually replacing Interview History when the route supports general Practice sessions;
- **Practice**, not interview, when describing the V2 generic domain;
- **Rubric criteria / performance areas**, not hard-coded candidate skills.

This allows InterviewGrade to support interview preparation while also expanding into technical practice, sales role-play, coaching and training.

---

# Delivery sequence

## Phase A — V2 dashboard cleanup

Do now during V2 polish:

1. Remove `InterviewTemplatesPage` from the dashboard composition.
2. Keep V2 Practice Progress and V2 Analytics as the complete dashboard.
3. Verify current summary, trend and performance-focus data.
4. Add/clean quick actions where useful.
5. Remove obvious candidate/interview-specific copy from the dashboard.

## Phase B — V2 analytics polish

After the core V2 flow is reliable:

1. Add Recent practices.
2. Adapt the reusable V1 radar-chart presentation to dynamic V2 rubric data.
3. Add stronger empty/data-sufficiency states.
4. Consider activity/completion charts only if they answer a real user question.

## Phase C — product expansion

Later:

- filtering/scoping by Practice or Practice category;
- comparison between latest and previous attempts;
- repeated-attempt improvement views;
- creator/team analytics when organisation workflows justify them.

---

# Product rule

> The dashboard is not a collection of every metric InterviewGrade can calculate. It is a progress surface that helps the user understand performance and choose the next Practice.

When a visualization does not improve that decision, prefer simpler cards or text.