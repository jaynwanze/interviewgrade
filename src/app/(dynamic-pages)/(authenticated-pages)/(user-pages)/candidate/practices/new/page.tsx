import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { GeneratePracticeDraftForm } from './GeneratePracticeDraftForm';
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/candidate/practices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My Practices
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">
            Create a practice
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Generate a complete editable draft from a brief, or start manually and
            build the questions and rubric yourself.
          </p>
        </div>
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

      {aiUnavailable && (
        <Alert tone="warning">
          AI drafting is temporarily unavailable. You can still create the practice
          manually below and use the same editor.
        </Alert>
      )}

      {unavailable && (
        <Alert tone="warning">
          The new practice creator is not available in this environment right now.
          Your existing mock interviews are unaffected.
        </Alert>
      )}

      <Card className="border-primary/20 bg-primary/[0.025] shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">Generate a draft with AI</CardTitle>
              <CardDescription className="max-w-2xl">
                InterviewGrade creates the scenario, questions, rubric, weights,
                timings, and question-to-rubric mappings. Nothing is published until
                you review it in the editor.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GeneratePracticeDraftForm />
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 py-1">
        <Separator className="flex-1" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Or build manually
        </span>
        <Separator className="flex-1" />
      </div>

      <form action={createPracticeAction} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xl">Practice setup</CardTitle>
                <CardDescription>
                  Create a small starting draft, then expand it in the full editor.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field
              label="Title"
              hint="What are you practising?"
              htmlFor="title"
            >
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
              hint="A short summary shown in your practice library."
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
              hint="Give the evaluator the context for the practice."
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Starter question</CardTitle>
            <CardDescription>
              Start with one prompt. Add, remove, and reorder questions in the
              editor after creation.
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Starter rubric</CardTitle>
            <CardDescription>
              The first criterion carries 100% of the score until you add and
              reweight more criteria in the editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
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

        <div className="flex items-center justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/candidate/practices">Cancel</Link>
          </Button>
          <Button type="submit">Create manual draft</Button>
        </div>
      </form>
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
