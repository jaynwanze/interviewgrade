# InterviewGrade V2 Product Model

This document defines the lightweight product and identity model for InterviewGrade after the V2 foundation checkpoint.

The goal is to avoid rebuilding the old Candidate / Employer role architecture while still supporting self-practice, shared Practices and later organisation use cases.

## Core rule

**Creator and Participant describe what a person is doing. They are not permanent account types.**

**Guest is not a product role. It is an authentication state for a Participant who is not signed in.**

A single signed-in person can create a Practice and also complete that Practice, or complete somebody else's Practice.

## Three separate concerns

Keep these concepts independent:

### 1. Authentication state

- **Anonymous** — no signed-in InterviewGrade account is required.
- **Signed in** — the person has an authenticated InterviewGrade identity.

Authentication answers: **Who is this person, if known?**

It must not determine whether somebody is permanently a Creator or Participant.

### 2. Product behavior

- **Creator** — creates, edits, publishes and shares Practices; views results for Practices they own or can manage.
- **Participant** — opens and completes a Practice; submits responses and receives feedback/reporting.

Product behavior answers: **What is this person doing in this workflow?**

Creator and Participant are contextual capabilities, not mutually exclusive roles.

### 3. Future workspace permissions

If teams/workspaces are introduced later, organisation permissions can use a separate model such as:

- Owner
- Admin
- Member
- Viewer

Workspace permission answers: **What may this person do inside this workspace?**

Do not use workspace roles to model the basic Creator / Participant Practice flow.

## Account policy

### Account required

An authenticated account is required to:

- create a Practice;
- edit or publish a Practice;
- manage owned Practices;
- view creator-side participant results;
- retain personal History / Analytics across devices and sessions;
- access account or billing settings.

### Account not required

By default, an account is **not** required to:

- open a public/shared Practice URL;
- read the Practice introduction;
- start a guest Practice session;
- submit voice responses;
- receive immediate feedback;
- finish the Practice and view the resulting report for that session.

A shared Practice link should remain a zero-install, low-friction entry point.

## Guest participants

A guest is simply an anonymous Participant.

Do not add values such as `guest`, `creator` or `participant` to a permanent `users.role` field for the V2 core product.

A guest session can continue to use nullable participant identity fields. If optional name/email capture is added later, it should describe the participant attached to that session rather than create a new global role system.

After completion, InterviewGrade may offer a soft conversion such as:

> Save this result and track your progress.

That conversion can offer Google or email sign-in. Completing the Practice must not depend on accepting it unless the Practice creator explicitly uses a future restricted/assignment mode.

## Signed-in participants

A signed-in person completing a Practice is still a Participant for that session.

Their authenticated user ID may attach the session to their History / Analytics. This does not stop them from also being the Creator of other Practices.

## Creators

Creator capability should derive from authenticated access plus resource ownership/authorization, not a permanent user-type flag.

Examples:

- A job seeker creates a DSA Practice and completes it themselves: **Creator + Participant**.
- A recruiter creates a screening Practice and shares it: **Creator**.
- A candidate opens that link without an account: **Anonymous Participant**.
- A lecturer creates an oral assessment: **Creator**.
- A signed-in student completes it and later creates their own Practice: **Participant, then Creator**.

## V2 authorization principle

Prefer resource-based authorization:

- `Practice.createdByUserId` / ownership decides who can manage a Practice;
- `Session.participantUserId` identifies a signed-in Participant when available;
- anonymous Sessions remain valid without a user ID;
- future organisation membership may extend management rights without changing the Creator / Participant model.

Avoid branching core V2 behavior on legacy `userType === 'candidate'` or `userType === 'employer'` wherever that legacy check is not required for transitional compatibility.

## Authentication UX direction

The intended lightweight authentication UX is:

### Creator / signed-in user

Offer:

- **Continue with Google**
- existing email / magic-link sign-in

Google should reduce creator sign-in friction, not introduce a new account type.

### Shared-link Participant

Opening `/p/[slug]` should not require authentication by default.

After completion, optionally offer sign-in to save the result/history.

Do not place an App Store install, account creation or Google sign-in gate in front of a normal shared Practice.

## Product naming direction

Move product language away from permanent Candidate / Employer identities where practical.

Preferred V2 language:

- Dashboard
- My Practices
- History
- Analytics / Progress
- Practice
- Participant
- Results

Legacy Candidate / Employer naming may remain temporarily in route paths, database tables or compatibility code. Do not perform risky route/database renames solely for terminology cleanup.

## Mobile implication

This product model reinforces the mobile strategy:

- creators can remain desktop-first for complex authoring;
- participants should be able to open a shared Practice and complete it in a modern mobile browser;
- no native app should be required for first-use participation;
- PWA/native app work can be evaluated later if repeat participant behavior justifies it.

## Not included in this decision

This document does not yet decide:

- final pricing or free-session limits;
- organisation billing;
- assignment-only/private Practice access;
- mandatory participant identity capture;
- teams/workspaces;
- enterprise SSO;
- native mobile app development.

Those decisions should be added only when the corresponding product need is real.

## Implementation sequence

1. Treat this model as the policy for new V2 work.
2. Add Google sign-in alongside the existing email/magic-link path for authenticated users.
3. Preserve account-free shared Practice participation.
4. Gradually remove unnecessary Candidate/Employer terminology and role checks from V2-facing code when touched.
5. Keep legacy auth/billing compatibility isolated rather than performing a large role-system rewrite.
6. Add workspace permissions later as a separate authorization layer if demand exists.

## Decision

The V2 model is therefore:

**Authentication:** Anonymous / Signed in

**Product behavior:** Creator / Participant

**Future organisation permissions:** Owner / Admin / Member / Viewer (or similar)

`Guest` means **Anonymous Participant** and is not a permanent role.
