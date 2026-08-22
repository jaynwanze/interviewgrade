# Upload Document → Generate Practice

Status: **implementation in progress — PDF/TXT first slice**

This feature reuses the existing V2 PracticeDraft, editor, rubric mapping, publishing, session and evaluation pipeline rather than introducing a parallel authoring system.

## Product goal

Let a creator upload source material and turn it into an editable InterviewGrade practice.

Useful source material includes:

- job descriptions;
- interview competency frameworks;
- PDF training material;
- Word documents;
- course or study notes;
- policies and procedures;
- sales playbooks;
- onboarding material;
- assessment briefs.

The creator should be able to go from a document to a useful first draft in a few minutes, then review and edit everything before publishing.

## Proposed Create Practice entry point

```text
Create practice

How would you like to start?

[ Generate with AI ]
[ Upload a document ]
[ Build manually ]
```

The existing AI generation and manual flows remain unchanged.

## First-version flow

```text
Upload document
      ↓
Validate file
      ↓
Extract text
      ↓
Creator adds optional instruction
      ↓
Existing AI Practice generator
      ↓
Structured PracticeDraft
      ↓
Normal V2 editor
      ↓
Preview
      ↓
Publish
```

The uploaded document is a source for draft generation only. It must never publish content automatically.

## MVP file types

Target:

- PDF;
- DOCX;
- TXT.

Implementation is intentionally sliced:

1. prove PDF + TXT through the full existing draft/editor pipeline without adding a new dependency;
2. add DOCX as the next small parser/dependency follow-up.

Do not add OCR in the first version unless real pilot documents demonstrate that scanned PDFs are a common requirement.

## Creator input

After upload, allow an optional short instruction such as:

```text
Turn this job description into a 5-question technical interview practice.
```

or:

```text
Create a customer-service role-play focused on de-escalation and policy knowledge.
```

This instruction should guide generation without replacing the source document.

## Generated draft

The document flow should generate the same V2 PracticeDraft shape as normal AI creation:

```text
title
description
scenario
instructions
difficulty
estimated duration
questions[]
  prompt
  guidance
  preparation time
  response time
rubric criteria[]
  name
  description
  weight
question → criterion mappings
```

The generated draft must pass the same Zod validation and publishing rules as any other V2 practice.

## Source handling

The generation service should receive extracted text plus creator instructions, not raw file parsing logic.

Prefer boundaries like:

```text
DocumentUploadService
  → validate file
  → extract text
  → return normalized source text

PracticeGenerator
  → receives source text + creator instruction
  → returns PracticeDraft
```

This keeps document parsing separate from AI generation and means future sources such as pasted URLs or integrations can reuse the same generator.

## Safety and limits

First version should include:

- allowed MIME/type validation;
- file size limit;
- extracted-text length limit;
- user-safe parse errors;
- user-safe AI generation errors;
- no browser exposure of provider/API secrets;
- no automatic publication;
- no silent replacement of an existing published PracticeVersion.

Large documents should be rejected or reduced deliberately rather than silently truncated in an unpredictable way.

## Storage decision

For the first implementation, the original document does not need durable storage:

```text
upload
→ extract text server-side
→ generate draft
→ discard source file
```

Only introduce durable source-file storage when creators need to revisit/download the original material or regenerate against the same source later.

If source files are stored in a future version, document retention/deletion behavior must be explicit.

## UI after generation

Once generation succeeds, send the creator to the existing editor.

Show lightweight source context such as:

```text
Generated from: senior-backend-engineer.pdf
```

The creator should still be able to edit every generated field, rubric weight and question mapping before publishing.

## Reuse, not duplication

Do **not** build:

- a separate document Practice model;
- a separate editor;
- separate publish logic;
- separate session logic;
- separate evaluation/scoring logic.

A document-created practice becomes an ordinary V2 draft as soon as generation succeeds.

## Acceptance criteria

The first useful version is complete when:

1. creator selects **Upload a document** from Create Practice;
2. PDF, DOCX or TXT can be uploaded;
3. invalid/oversized files fail safely;
4. supported document text is extracted server-side;
5. creator can provide an optional generation instruction;
6. the existing AI generator returns a schema-valid V2 PracticeDraft;
7. the creator lands in the normal editor;
8. all generated content is editable;
9. Preview and Publish use the normal V2 flow;
10. the published practice can run through the existing session/evaluation/report pipeline;
11. generation failures do not create partially published content.

The PDF/TXT first slice intentionally leaves criterion 2 partially open until DOCX is added.

## Testing

Add coverage for:

- supported file validation;
- unsupported file rejection;
- empty/extraction-failed document;
- oversized document;
- extraction → PracticeDraft generation boundary;
- generated draft validation;
- one E2E happy path using a small fixture document.

Provider AI calls can be faked in CI.

## Implementation timing

The V2 foundation checkpoint has been accepted complete. Critical-path E2E and Supabase migration-history repair remain documented non-blocking engineering follow-ups rather than prerequisites for starting this feature.

The current implementation order is:

1. PDF/TXT upload → extraction → existing Practice generator/editor;
2. production smoke test with a small source document;
3. DOCX parser/dependency follow-up;
4. better sharing/results work from the main roadmap.

## Future extensions — not first version

Potential later additions:

- multiple documents in one practice;
- paste a URL/web page;
- Google Drive / OneDrive source import;
- source citations inside generated questions;
- regenerate selected questions from the same source;
- source-aware follow-up questions;
- OCR for scanned PDFs;
- organisation document libraries;
- reusable knowledge bases.

These should follow real customer demand rather than delay the simple upload → draft workflow.
