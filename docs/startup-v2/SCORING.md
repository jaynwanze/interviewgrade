# InterviewGrade v2 scoring

This document is the source of truth for how InterviewGrade v2 turns a participant's answers into question scores, rubric scores and a final session score.

It is written for both people and coding agents. If the implementation and this document ever disagree, treat that as a bug: update them together in the same change.

## The short version

InterviewGrade scores evidence against a published rubric.

1. A Practice has rubric criteria with weights that total 100%.
2. Each question is mapped to one or more of those criteria.
3. The participant's latest answer to a question is scored from 0-100 only on the criteria mapped to that question.
4. A question score is the weighted average of its mapped criterion scores.
5. At the end of the session, each rubric criterion gets a session score by averaging its scores across the answered questions that were mapped to it.
6. The final session score is the weighted average of those session-level criterion scores.
7. If a criterion has no answered evidence, it is omitted rather than treated as zero; the remaining weights are normalized.

The result is deliberately explainable: the rubric-performance cards on the final report should be enough to reconstruct the final score.

## Terms

### Rubric criterion

A dimension the Practice creator wants to assess, for example:

- Algorithmic correctness
- Time and space complexity
- Communication
- Python implementation clarity

Each published criterion has a percentage weight. Published Practice versions must have valid rubric weights that total 100%.

### Question-to-criterion mapping

A question does not have to assess every rubric criterion.

For example:

- Question 1 may assess Correctness + Complexity.
- Question 2 may assess Communication only.
- Question 3 may assess Correctness + Communication.

The mapping is frozen into the published PracticeVersion. Later edits to the Practice must not change the scoring rules for an existing Session.

### Evidence

A saved response is evidence for the criteria mapped to its question. A criterion with no answered mapped question has no evidence and must not be silently scored as zero.

## 1. Response / question scoring

For one answered question, OpenAI returns a 0-100 score for every criterion mapped to that question.

The question's overall score is deterministic. The model does not choose the overall score directly.

Formula:

```text
question score =
  sum(criterion score * published criterion weight)
  -------------------------------------------------
  sum(published weights of criteria mapped to question)
```

This normalization matters when a question maps to only part of the rubric.

### Example

Published rubric:

```text
Correctness     70%
Communication   30%
```

Question 1 maps only to Correctness and receives Correctness = 80.

```text
question score = (80 * 70) / 70 = 80
```

We do not multiply the result down to 56 simply because Communication is not assessed by this question.

## 2. Retry behavior

All attempts remain stored as history, but the final report uses only the latest attempt for each question.

If Question 1 has attempts 1, 2 and 3, only attempt 3 contributes to the final session aggregation.

This prevents retries from being double-counted while preserving history for future review features.

## 3. Session-level criterion scores

For each rubric criterion, collect the latest response evaluations from answered questions mapped to that criterion, then take their arithmetic mean.

Formula:

```text
session criterion score =
  sum(criterion scores from answered mapped questions)
  ----------------------------------------------------
  number of answered mapped questions
```

If no answered question mapped to a criterion, omit that criterion from the session aggregation instead of fabricating a zero.

### Example

Correctness scores from three answered mapped questions:

```text
15, 10, 10
```

Then:

```text
Correctness session score = (15 + 10 + 10) / 3 = 11.67
```

The report can display this as 12/100 while retaining the stored decimal value for aggregation.

## 4. Final session score

The final score is derived from the session-level rubric scores, not from simply giving every answered question equal weight.

Formula:

```text
final session score =
  sum(session criterion score * published criterion weight)
  ---------------------------------------------------------
  sum(published weights for criteria that have evidence)
```

When every criterion has evidence, the denominator is 100.

When some criteria have no answered evidence, the denominator is the sum of the remaining evidenced weights. This avoids penalizing a participant for criteria the session never actually assessed.

## 5. Worked example from the DSA smoke test

Published rubric:

```text
Algorithmic correctness and edge-case handling   36%
Time and space complexity analysis               29%
Problem solving, tradeoffs, and communication    21%
Pythonic implementation and code clarity         14%
                                                  ----
                                                  100%
```

Three answered questions produced these criterion scores:

```text
                  Q1   Q2   Q3   Session average
Correctness       15   10   10      11.67
Complexity         5    0    5       3.33
Problem solving   10    5   10       8.33
Python clarity     5    5    5       5.00
```

Final score:

```text
11.67 * 36% = 4.2012
 3.33 * 29% = 0.9657
 8.33 * 21% = 1.7493
 5.00 * 14% = 0.7000
             --------
               7.6162 ~= 7.62 ~= 8/100 in the UI
```

This is why the final rubric cards and overall score should visibly feel connected.

## 6. Why we do not simply average question scores

A simple average makes every question equally important at the session level, even when the published rubric says otherwise.

Consider:

```text
Correctness     70%
Communication   30%

Q1 -> Correctness only
Q2 -> Communication only
```

If Q1 scores 80 and Q2 scores 40, a plain question average is:

```text
(80 + 40) / 2 = 60
```

But that silently turns the intended 70/30 rubric into a 50/50 rubric.

The rubric-weighted session model preserves the creator's intent:

```text
80 * 70% + 40 * 30% = 68
```

## 7. Partial completion

A participant may finish before answering every question.

Rules:

- Saved answers remain valid evidence.
- Only latest answered attempts are evaluated.
- A criterion is included if at least one answered mapped question produced evidence for it.
- A criterion with no evidence is omitted, not scored zero.
- Remaining criterion weights are normalized in the final-score denominator.

Example:

```text
Correctness     70% -> evidence exists, score 80
Communication   30% -> no answered mapped question
```

Then:

```text
final score = (80 * 70) / 70 = 80
```

The report should also state how many responses were evaluated so a partial report is not mistaken for a full completion.

## 8. What the UI should explain

The final report should make the scoring chain visible without requiring the user to read this document.

### Overall score area

Explain that the final score comes from the weighted session-level rubric scores.

### Rubric performance cards

Show:

- criterion score out of 100;
- published rubric weight;
- how many evaluated responses supplied evidence for the criterion.

### How your score is calculated

Show a short formula/explanation and the contribution of each evidenced criterion to the final score.

### Response review

For each question, make clear that:

- only criteria mapped to that question are scored;
- the question score is a normalized weighted average of those mapped criteria;
- the displayed criterion cards are the evidence behind that question score.

## 9. Historical reports and versioning

Evaluation results are persisted. Historical reports should not silently change when scoring semantics change later.

Current identifiers live in `src/modules/evaluation/evaluation.service.ts`:

- `RESPONSE_EVALUATION_SCHEMA_VERSION`
- `SESSION_EVALUATION_SCHEMA_VERSION`
- `SESSION_AGGREGATION_VERSION`

When the meaning of aggregation changes, update `SESSION_AGGREGATION_VERSION` and this document in the same PR.

Existing persisted reports retain the metadata for the aggregation model that created them. New reports use the current aggregation model.

## 10. Implementation map

Main files:

- `src/modules/evaluation/evaluation.generator.ts`
  - asks the model for criterion-level response evidence;
  - validates exact criterion coverage;
  - calculates a question's normalized weighted score.
- `src/modules/evaluation/evaluation.service.ts`
  - selects the latest attempt per question;
  - aggregates evidence into session-level criterion scores;
  - calculates the final rubric-weighted session score.
- `src/app/session/[sessionId]/report/page.tsx`
  - explains and displays the persisted scoring result.
- `src/modules/practice/practice.schema.ts`
  - defines questions, criteria, mappings and rubric weights.

## 11. Invariants for future changes

Do not change these accidentally:

1. The model scores criteria; deterministic application code calculates weighted totals.
2. A question is evaluated only against its mapped criteria.
3. Mapped weights are normalized for the question score.
4. Latest attempt per question is used for the final report.
5. Session criterion scores average only actual evidence for that criterion.
6. Missing evidence is omitted, not converted to zero.
7. Final session score is derived from weighted session-level criterion scores.
8. Published PracticeVersion mappings and weights are immutable for existing Sessions.
9. Any scoring-semantics change must update the aggregation version, this document and the report explanation together.
