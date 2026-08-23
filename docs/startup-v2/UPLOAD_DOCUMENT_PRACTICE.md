# Upload Document → Generate Practice

Status: **PDF/TXT shipped and production-smoke-passed; DOCX deferred**

This feature reuses the existing V2 PracticeDraft, editor, rubric mapping, publishing, session and evaluation pipeline rather than introducing a parallel authoring system.

## Product goal

Let a creator upload source material and turn it into an editable InterviewGrade Practice.

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

The creator should be able to go from a document to a useful first draft quickly, then review and edit everything before publishing.

## Create Practice entry point

```text
Create Practice

How would you like to start?

[ Generate with AI ]
[ Upload a document ]
[ Build manually ]
```

The normal AI generation and manual flows remain separate entry points but converge on the same editable V2 Practice draft/editor model.

## Current flow

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

The uploaded document is a source for draft generation only. It never publishes content automatically.

## File types

Current production support:

- text-based PDF;
- TXT.

Deferred small follow-up:

- DOCX.

Do not add OCR until real pilot documents demonstrate that scanned PDFs are a common requirement.

## Creator input

After upload, allow an optional short instruction such as:

```text
Turn this job description into a 5-question technical interview Practice.
```

or:

```text
Create a customer-service role-play focused on de-escalation and policy knowledge.
```

This instruction guides generation without replacing the source document.

## Generated draft

The document flow generates the same V2 PracticeDraft shape as normal AI creation:

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

The generated draft must pass the same Zod validation and publishing rules as any other V2 Practice.

## Source handling

The generation service receives extracted text plus creator instructions, not raw file parsing logic.

Keep boundaries conceptually like:

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

The shipped PDF/TXT path includes:

- allowed type validation;
- file size limit;
- extracted-text length limit;
- explicit unsupported/oversized/empty/scanned/overlong errors;
- user-safe AI generation errors;
- no browser exposure of provider/API secrets;
- no automatic publication;
- no silent replacement of an existing published PracticeVersion.

Large documents are rejected deliberately rather than silently truncated unpredictably.

## Storage decision

The original document is not durably stored in the current implementation:

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

Use a generic source notice rather than persisting the user's local filename into editor URLs/history or the durable Practice model.

The creator can edit every generated field, rubric weight and question mapping before publishing.

## Reuse, not duplication

Do **not** build:

- a separate document Practice model;
- a separate editor;
- separate publish logic;
- separate session logic;
- separate evaluation/scoring logic.

A document-created Practice becomes an ordinary V2 draft as soon as generation succeeds.

## Current acceptance status

The PDF/TXT slice is complete when:

1. creator selects **Upload a document** from Create Practice — **shipped**;
2. PDF/TXT upload works — **shipped**;
3. invalid/oversized files fail safely — **shipped**;
4. supported document text is extracted server-side — **shipped**;
5. creator can provide an optional generation instruction — **shipped**;
6. the existing AI generator returns a schema-valid V2 PracticeDraft — **shipped**;
7. the creator lands in the normal editor — **shipped**;
8. all generated content is editable — **shipped**;
9. Preview and Publish use the normal V2 flow — **shipped**;
10. the published Practice can run through the existing session/evaluation/report pipeline — **production smoke passed**;
11. generation failures do not create partially published content — **shipped**;
12. DOCX can use the same flow once a parser dependency is deliberately added — **deferred**.

## Testing

Keep coverage for:

- supported file validation;
- unsupported file rejection;
- empty/extraction-failed document;
- oversized document;
- extraction → PracticeDraft generation boundary;
- generated draft validation;
- one E2E happy path using a small fixture document when the critical E2E suite is expanded.

Provider AI calls can be faked in CI.

## Current follow-up order

The original PDF/TXT implementation and production smoke test are complete.

Remaining document-specific work is intentionally small:

1. add DOCX only when it is worth the additional parser dependency;
2. add fixture/E2E coverage as part of the broader critical-path E2E work;
3. consider OCR, multi-document inputs or durable source storage only from real usage evidence.

Document work is not the current active product slice. See [ROADMAP.md](./ROADMAP.md).

## Future extensions — not current scope

Potential later additions:

- multiple documents in one Practice;
- paste a URL/web page;
- Google Drive / OneDrive source import;
- source citations inside generated questions;
- regenerate selected questions from the same source;
- source-aware follow-up questions;
- OCR for scanned PDFs;
- organisation document libraries;
- reusable knowledge bases.

These should follow real customer demand rather than delay the simple upload → draft workflow.
