# V2 Practice Run Entitlements

## Status

**Decision accepted for the next V2 billing/usage implementation slice.**

This document defines how InterviewGrade V2 should account for AI-evaluated Practice usage for both self-practice and shared participant sessions while preserving the existing Stripe subscription system.

It deliberately does **not** redesign Team/Enterprise billing, sell usage packs, or remove the remaining V1 billing implementation.

## Product principle

A single understandable unit should fund the expensive part of the V2 product:

> **One AI-evaluated Practice run.**

The same unit applies whether the account owner completes a Practice themselves or another person completes a Practice that account owner created and shared.

This keeps V2 aligned with the Creator / Participant product model:

- a signed-in user can be a Creator, Participant, or both;
- a Guest is an anonymous Participant, not a billing identity;
- normal shared-Practice participation remains account-free;
- the account that owns the Practice funds anonymous/shared participant usage.

## Existing billing infrastructure to keep

V2 should reuse rather than replace the working subscription foundation:

- Free and Pro remain the current individual plans;
- Pro remains **€9.99/month** for this implementation phase;
- existing Stripe customers/subscriptions must continue to work without resubscription;
- keep Stripe Checkout, subscription persistence/synchronization, webhook verification, and the customer billing portal;
- V2 should read the existing account subscription state to determine whether an account is Free or Pro;
- legacy employer token bundles remain a frozen V1 compatibility surface and are **not** the V2 usage model.

The old V1 entitlement matrix should not define the new product. In particular, old Candidate/Employer-specific gates, sentiment features, mock-interview limits, and token semantics are not V2 primitives.

## Initial V2 limits

Start deliberately conservative until real usage and unit economics are measured.

| Entitlement | Free | Pro |
| --- | ---: | ---: |
| Manual Practice creation/editing | Unlimited | Unlimited |
| Publish and share Practice links | Unlimited | Unlimited |
| AI-evaluated Practice runs | **3 / month** | **50 / month** |
| Creator Results access | Full | Full |
| Rubric feedback/report quality | Full | Full |

The Free plan should demonstrate the complete InterviewGrade feedback experience with lower volume rather than hiding the useful rubric/report output behind a paywall.

The Pro 50-run ceiling replaces the V1 concept of literal unlimited AI-backed Practice usage. It can be increased later if telemetry shows the cost/session and abuse profile justify it.

## What counts as a Practice run

A Practice run is consumed only when a session submits its **first valid response**.

| Event | Consumes a run? |
| --- | --- |
| Open `/p/[slug]` | No |
| Create/start an empty session | No |
| Submit the first valid answer | **Yes — exactly one run** |
| Submit later answers in the same session | No additional run |
| Retry a question in the same session | No additional run |
| Generate/retry the final report | No additional run |
| View/share creator results | No |

This boundary matches the point where meaningful AI-backed work begins and prevents simple page refreshes or repeated Start clicks from draining a creator's monthly allowance.

## Who funds the run

### Self-practice

If the account owner starts a Practice they own, that account funds the run.

### Shared Practice

If a participant opens a public Practice and completes it as a Guest or signed-in Participant, the **Practice owner/Creator** funds the run.

The Guest should never be asked to buy Pro merely to complete someone else's shared Practice.

Conceptually:

```text
Creator publishes Practice
        ↓
participant opens shared link
        ↓
participant starts session
        ↓
first valid answer is submitted
        ↓
resolve Practice owner
        ↓
check owner's Free/Pro monthly allowance
        ↓
atomically consume one Practice run
        ↓
save/evaluate response
```

## Exhausted allowance behavior

If the Practice owner has no remaining runs, do not expose the owner's plan or show a participant upsell.

The shared participant should see a neutral product state such as:

> This Practice has reached its participant limit for this month. Please contact the person who shared it with you.

The Creator-side product can separately show the allowance state and an appropriate upgrade action.

## V2 usage ledger

Do not continue deriving V2 consumption from the legacy `interviews` table.

Add a V2-owned ledger with one row per consumed session. The exact migration naming can be finalized during implementation, but the intended shape is:

```text
practice_run_usage

id
session_id          UNIQUE
practice_id
funder_user_id
consumed_at
```

Required properties:

- `session_id` is unique so one session can consume at most one run;
- `practice_id` allows Practice-level analysis and debugging;
- `funder_user_id` is the account whose entitlement was charged;
- `consumed_at` is the monthly accounting timestamp;
- usage is server-owned and follows the same no-browser-grants boundary as the other V2 persistence tables.

The ledger should record consumption, not merely infer it from sessions, because empty sessions intentionally do not count.

## Atomic reservation requirement

The allowance check and ledger insertion must behave atomically.

A creator with one remaining run may have multiple participants submit concurrently. The implementation must not allow each request to observe the same remaining allowance and all proceed.

The implementation should therefore reserve a run in a database transaction / database-enforced operation that:

1. resolves the funding account;
2. determines the current monthly limit from Free/Pro subscription state;
3. counts already consumed ledger rows for that funder in the current billing month boundary used by V2;
4. rejects when the limit is exhausted;
5. inserts the unique session ledger row;
6. treats an already-present row for the same session as idempotent success.

Only after the session has a valid reservation should the first response proceed into the expensive evaluation path.

## Relationship to existing V1 quota code

Today V2 still uses a compatibility gateway that asks the old Candidate billing code for Practice allowance and then combines legacy and V2 session counts.

For this V2 entitlement slice, narrow that dependency further:

```text
Legacy billing/subscription data
        ↓
V2 compatibility boundary
        ↓
Free or Pro subscription state only

V2 Practice-run ledger
        ↓
owns V2 monthly consumption
```

V1 routes can keep their old limits while they remain frozen/available. V2 should stop using old monthly `interviews` usage as its accounting source.

Do not destructively remove legacy Stripe/billing code as part of this change.

## Shared-link abuse protection

Billing protection and request abuse protection are separate concerns.

Because empty sessions intentionally do not consume a paid run, public shared links also need a cheap rate limit on session creation/start attempts.

Initial product target:

- approximately **30 new sessions per Practice per hour**;
- rate-limited empty starts do not consume Practice runs;
- the exact implementation mechanism should be chosen during the implementation pass based on infrastructure already available;
- do not introduce a heavyweight assignment/identity system just to rate-limit anonymous links.

This rate limit protects database/runtime resources. The monthly Practice-run allowance protects AI spend.

## AI Practice generation

AI Practice generation and document → Practice generation also incur AI cost, but they are **not part of this first run-entitlement implementation**.

Do not block tomorrow's run-protection work on a generator quota design.

After execution usage is protected and measured, define a separate, simple generation allowance if needed. Avoid exposing low-level token/credit accounting to users unless there is a strong product reason.

## Implementation sequence

### PR 1 — V2 Practice run entitlements

- add the V2 usage-ledger migration/schema;
- define Free = 3 and Pro = 50 V2 Practice-run constants;
- reuse existing subscription state to resolve Free vs Pro;
- resolve the Practice owner as the funding account for shared sessions;
- atomically reserve one run on the first valid response;
- make reservation idempotent per `session_id`;
- prevent expensive first-response processing when allowance is exhausted;
- add participant-safe exhausted-state handling;
- stop V2 monthly accounting from depending on the legacy `interviews` usage count;
- document/test self-practice and guest shared-Practice funding behavior.

### PR 2 — Shared-link abuse protection

- rate-limit empty public session creation/start attempts;
- return a friendly temporary-limit state;
- confirm abusive starts cannot consume monthly Practice runs;
- expose Creator-side remaining usage where it improves the sharing/results UX.

## Explicitly out of scope

Do **not** mix the following into these PRs:

- changing the Stripe Pro product or requiring existing subscribers to resubscribe;
- a full pricing-page redesign;
- Team/Enterprise/workspace billing;
- extra paid run bundles;
- V2 employer token bundles;
- destructive V1 billing cleanup;
- DOCX support;
- AI-generation quotas;
- native/mobile work;
- assignment/cohort architecture.

## Follow-up pricing cleanup

After the entitlement path is proven in production, update product copy so the public pricing and account billing UI describe the V2 product consistently.

The future message should center on full-quality Practice feedback with different usage volumes, not the old V1 collection of mock-interview, sentiment, radar-chart, AI-coach, and Candidate-specific feature gates.

A likely simple framing is:

```text
Free
3 AI-evaluated Practice runs / month
full feedback experience

Pro — €9.99/month
50 AI-evaluated Practice runs / month
higher usage + richer convenience/analytics over time
```

Do not promise literal unlimited AI usage until V2 unit economics support that commitment.

## Success criteria

This slice is accepted when all of the following are true:

- a Free account can fund at most 3 V2 Practice runs in the month;
- a Pro account can fund at most 50 V2 Practice runs in the month;
- self-practice and shared guest sessions draw from the same account allowance;
- opening/starting empty shared sessions does not consume the allowance;
- the first valid response consumes exactly one run;
- all later questions/report retries in that session remain included;
- concurrent first-response submissions cannot oversubscribe the allowance;
- a Guest never needs an InterviewGrade account or paid plan to use an available shared Practice;
- exhausted shared Practices fail before expensive AI evaluation;
- existing Stripe subscribers continue to work unchanged;
- creator sharing/results continues to work on top of the protected usage model.
