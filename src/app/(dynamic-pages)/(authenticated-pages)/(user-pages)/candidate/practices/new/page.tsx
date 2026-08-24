import Link from 'next/link';
import { ArrowLeft, ChevronDown, FileText, Sparkles, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { GeneratePracticeDraftForm } from './GeneratePracticeDraftForm';
import { UploadPracticeDocumentForm } from './UploadPracticeDocumentForm';
import { createPracticeAction } from './actions';

export const maxDuration = 60;

type CreatePracticePageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function CreatePracticePage({
  searchParams,
}: CreatePracticePageProps) {
  const invalid = searchParams?.error === 'invalid';
  const unavailable = searchParams?.error === 'unavailable';
  const invalidAiBrief = searchParams?.error === 'ai-input';
  const aiUnavailable = searchParams?.error === 'ai';
  const aiLimit = searchParams?.error === 'ai-limit';
  const documentInput = searchParams?.error === 'document-input';
  const documentType = searchParams?.error === 'document-type';
  const documentSize = searchParams?.error === 'document-size';
  const documentEmpty = searchParams?.error === 'document-empty';
  const documentLength = searchParams?.error === 'document-length';
  const documentUnavailable = searchParams?.error === 'document';
  const documentAiUnavailable = searchParams?.error === 'document-ai';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/candidate/practices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            My Practices
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Create a Practice</h1>
        <p className="max-w-2xl text-muted-foreground">
          Start with AI, a source document, or build one manually.
        </p>
      </div>

      {invalid && (
        <Alert tone="destructive">
          Check the manual form and make sure every field has enough detail.
        </Alert>
      )}

      {invalidAiBrief && (
        <Alert tone="destructive">
          Give InterviewGrade a little more detail about what you want to practise.
        </Alert>
      )}

      {aiLimit && (
        <Alert tone="warning">
          You have used this month&apos;s AI-created Practice allowance. It resets next
          month, and manual Practice creation is still available below.{' '}
          <Link
            href="/candidate/settings/billing"
            className="font-medium underline underline-offset-4"
          >
            View Plan &amp; Usage
          </Link>
          .
        </Alert>
      )}

      {aiUnavailable && (
        <Alert tone="warning">
          AI creation is temporarily unavailable. You can still build a Practice
          manually below.
        </Alert>
      )}

      {documentInput && (
        <Alert tone="destructive">
          Choose a supported document and check the options before trying again.
        </Alert>
      )}

      {documentType && (
        <Alert tone="destructive">
          Document creation currently supports text-based PDF and TXT files.
        </Alert>
      )}

      {documentSize && (
        <Alert tone="destructive">
          The document is larger than 5 MB. Choose a smaller source file.
        </Alert>
      )}

      {documentEmpty && (
        <Alert tone="destructive">
          InterviewGrade could not find enough readable text in that document.
          Scanned-image PDFs are not supported yet.
        </Alert>
      )}

      {documentLength && (
        <Alert tone="destructive">
          The extracted document is too long. Use a shorter source document;
          InterviewGrade will not silently truncate it.
        </Alert>
      )}

      {documentUnavailable && (
        <Alert tone="warning">
          InterviewGrade could not read that document. Try another PDF or TXT file.
        </Alert>
      )}

      {documentAiUnavailable && (
        <Alert tone="warning">
          The document was read successfully, but AI creation is temporarily
          unavailable. Your source file was not stored.
        </Alert>
      )}

      {unavailable && (
        <Alert tone="warning">
          Practice creation is not available in this environment right now. Your
          existing Practices are unaffected.
        </Alert>
      )}

      <section className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card className="h-full border-primary/20 bg-primary/[0.025] shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Create with AI</CardTitle>
                <CardDescription>
                  Describe what you want to practise. We&apos;ll create an editable
                  draft with questions and a rubric.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GeneratePracticeDraftForm />
          </CardContent>
        </Card>

        <Card className="h-full shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2.5 text-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Create from document</CardTitle>
                <CardDescription>
                  Upload a PDF or TXT source and turn it into the same editable
                  Practice draft.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UploadPracticeDocumentForm />
          </CardContent>
        </Card>
      </section>

      <details className="group overflow-hidden rounded-xl border bg-card/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-muted p-2.5 text-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold">Build manually</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Start from a blank draft and define the first question and rubric
                yourself.
              </div>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <form action={createPracticeAction} className="space-y-5 border-t p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Practice setup</CardTitle>
                <CardDescription>
                  Create the starting details, then refine them in the editor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field label="Title" hint="What are you practising?" htmlFor="title">
                  <Input
                    id="title"
                    name="title"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Senior frontend interview"
                  />
                </Field>

                <Field
                  label="Description"
                  hint="A short summary shown in your Practice library."
                  htmlFor="description"
                >
                  <Textarea
                    id="description"
                    name="description"
                    required
                    minLength={10}
                    maxLength={1000}
                    placeholder="Prepare for a senior frontend engineering interview focused on React, architecture, and communication."
                  />
                </Field>

                <Field
                  label="Scenario"
                  hint="Give the evaluator the context for the Practice."
                  htmlFor="scenario"
                >
                  <Textarea
                    id="scenario"
                    name="scenario"
                    required
                    minLength={10}
                    maxLength={1500}
                    className="min-h-28"
                    placeholder="You are interviewing for a senior frontend role at a product company. The interview should test technical judgement and how clearly you explain trade-offs."
                  />
                </Field>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Starter question</CardTitle>
                  <CardDescription>
                    Start with one prompt. Add or reorder questions in the editor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Field
                    label="Question"
                    hint="Write the first prompt the learner should answer."
                    htmlFor="question"
                  >
                    <Textarea
                      id="question"
                      name="question"
                      required
                      minLength={5}
                      maxLength={1000}
                      className="min-h-28"
                      placeholder="Tell me about a difficult frontend architecture decision you made and how you evaluated the trade-offs."
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Starter rubric</CardTitle>
                  <CardDescription>
                    Add one criterion now. You can expand and reweight it later.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Criterion name"
                    hint="The skill being assessed."
                    htmlFor="rubricName"
                  >
                    <Input
                      id="rubricName"
                      name="rubricName"
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Technical judgement"
                    />
                  </Field>

                  <Field
                    label="What good looks like"
                    hint="Describe the evidence a strong answer should contain."
                    htmlFor="rubricDescription"
                  >
                    <Textarea
                      id="rubricDescription"
                      name="rubricDescription"
                      required
                      minLength={5}
                      maxLength={1000}
                      placeholder="Explains alternatives, trade-offs, constraints, and why the final decision was appropriate."
                    />
                  </Field>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button asChild variant="outline">
              <Link href="/candidate/practices">Cancel</Link>
            </Button>
            <Button type="submit">Create manual draft</Button>
          </div>
        </form>
      </details>
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: 'warning' | 'destructive';
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === 'destructive'
          ? 'rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'
          : 'rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground'
      }
    >
      {children}
    </div>
  );
}
