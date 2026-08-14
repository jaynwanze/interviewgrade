'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
import type { Practice } from '@/modules/practice/practice.schema';

import { updatePracticeDraftAction } from './actions';

type EditorQuestion = {
  clientId: string;
  prompt: string;
  guidance: string;
  preparationSeconds: number;
  responseSeconds: number;
};

type EditorCriterion = {
  clientId: string;
  name: string;
  description: string;
  weight: number;
};

function newClientId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PracticeEditor({ practice }: { practice: Practice }) {
  const [title, setTitle] = useState(practice.draft.title);
  const [description, setDescription] = useState(practice.draft.description);
  const [scenario, setScenario] = useState(practice.draft.scenario);
  const [instructions, setInstructions] = useState(
    practice.draft.instructions ?? '',
  );
  const [difficulty, setDifficulty] = useState(
    practice.draft.difficulty ?? 'Medium',
  );
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(
    practice.draft.estimatedDurationMinutes ?? 10,
  );
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    practice.draft.questions.map((question, index) => ({
      clientId: question.id ?? `question-${index}`,
      prompt: question.prompt,
      guidance: question.guidance ?? '',
      preparationSeconds: question.preparationSeconds ?? 30,
      responseSeconds: question.responseSeconds ?? 120,
    })),
  );
  const [criteria, setCriteria] = useState<EditorCriterion[]>(
    practice.draft.rubricCriteria.map((criterion, index) => ({
      clientId: criterion.id ?? `criterion-${index}`,
      name: criterion.name,
      description: criterion.description,
      weight: criterion.weight,
    })),
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const rubricTotal = useMemo(
    () => criteria.reduce((sum, criterion) => sum + (criterion.weight || 0), 0),
    [criteria],
  );
  const rubricReady = Math.abs(rubricTotal - 100) <= 0.01;
  const archived = practice.status === 'archived';
  const submitAction = updatePracticeDraftAction.bind(null, practice.id);

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        clientId: newClientId('question'),
        prompt: '',
        guidance: '',
        preparationSeconds: 30,
        responseSeconds: 120,
      },
    ]);
  }

  function updateQuestion(
    index: number,
    patch: Partial<Omit<EditorQuestion, 'clientId'>>,
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((current) => moveItem(current, index, direction));
  }

  function addCriterion() {
    setCriteria((current) => [
      ...current,
      {
        clientId: newClientId('criterion'),
        name: '',
        description: '',
        weight: 0,
      },
    ]);
  }

  function updateCriterion(
    index: number,
    patch: Partial<Omit<EditorCriterion, 'clientId'>>,
  ) {
    setCriteria((current) =>
      current.map((criterion, criterionIndex) =>
        criterionIndex === index ? { ...criterion, ...patch } : criterion,
      ),
    );
  }

  function removeCriterion(index: number) {
    setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveCriterion(index: number, direction: -1 | 1) {
    setCriteria((current) => moveItem(current, index, direction));
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/candidate/practices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My Practices
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {title || 'Untitled practice'}
            </h1>
            <StatusBadge status={practice.status} />
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Edit the private working draft. Publishing freezes the current version
            for future sessions and creates a fresh editable draft automatically.
          </p>
        </div>

        <Button
          type="button"
          variant={previewOpen ? 'secondary' : 'outline'}
          onClick={() => setPreviewOpen((open) => !open)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {previewOpen ? 'Hide preview' : 'Preview'}
        </Button>
      </div>

      {previewOpen && (
        <PracticePreview
          title={title}
          description={description}
          scenario={scenario}
          instructions={instructions}
          difficulty={difficulty}
          estimatedDurationMinutes={estimatedDurationMinutes}
          questions={questions}
          criteria={criteria}
          rubricTotal={rubricTotal}
        />
      )}

      {archived && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          This practice is archived and cannot be edited or published.
        </div>
      )}

      <form action={submitAction} className="space-y-6">
        <input
          type="hidden"
          name="questionsJson"
          value={JSON.stringify(
            questions.map(({ clientId: _clientId, ...question }) => ({
              ...question,
              guidance: question.guidance.trim() || null,
            })),
          )}
        />
        <input
          type="hidden"
          name="rubricJson"
          value={JSON.stringify(
            criteria.map(({ clientId: _clientId, ...criterion }) => criterion),
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle>Practice setup</CardTitle>
            <CardDescription>
              Define the context the learner and evaluation pipeline should use.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                disabled={archived}
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                minLength={10}
                maxLength={1000}
                disabled={archived}
              />
            </Field>

            <Field label="Scenario" htmlFor="scenario">
              <Textarea
                id="scenario"
                name="scenario"
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
                required
                minLength={10}
                maxLength={2000}
                className="min-h-32"
                disabled={archived}
              />
            </Field>

            <Field
              label="Instructions"
              hint="Optional directions shown before the learner starts."
              htmlFor="instructions"
            >
              <Textarea
                id="instructions"
                name="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                maxLength={2000}
                disabled={archived}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Difficulty" htmlFor="difficulty">
                <select
                  id="difficulty"
                  name="difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  disabled={archived}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Medium">Medium</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </Field>

              <Field
                label="Estimated duration"
                hint="Minutes"
                htmlFor="estimatedDurationMinutes"
              >
                <Input
                  id="estimatedDurationMinutes"
                  name="estimatedDurationMinutes"
                  type="number"
                  min={1}
                  max={240}
                  value={estimatedDurationMinutes}
                  onChange={(event) =>
                    setEstimatedDurationMinutes(Number(event.target.value))
                  }
                  disabled={archived}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription className="mt-1.5">
                  The order below is the order learners will receive the prompts.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                disabled={archived || questions.length >= 50}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.clientId}
                question={question}
                index={index}
                count={questions.length}
                disabled={archived}
                onChange={(patch) => updateQuestion(index, patch)}
                onRemove={() => removeQuestion(index)}
                onMove={(direction) => moveQuestion(index, direction)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Scoring rubric</CardTitle>
                <CardDescription className="mt-1.5">
                  Criteria can be saved at any positive weights. Publishing
                  requires the total to equal 100%.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCriterion}
                disabled={archived || criteria.length >= 30}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add criterion
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {criteria.map((criterion, index) => (
              <CriterionEditor
                key={criterion.clientId}
                criterion={criterion}
                index={index}
                count={criteria.length}
                disabled={archived}
                onChange={(patch) => updateCriterion(index, patch)}
                onRemove={() => removeCriterion(index)}
                onMove={(direction) => moveCriterion(index, direction)}
              />
            ))}

            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                rubricReady
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <span className="font-medium">Total rubric weight</span>
              <span className="font-semibold">{formatWeight(rubricTotal)}%</span>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Save keeps the draft private. Publish freezes this version for
            reproducible sessions.
          </p>
          <div className="flex gap-2 sm:justify-end">
            <Button
              type="submit"
              name="intent"
              value="save"
              variant="outline"
              disabled={archived}
            >
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
            <Button
              type="submit"
              name="intent"
              value="publish"
              disabled={archived || !rubricReady}
            >
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  count,
  disabled,
  onChange,
  onRemove,
  onMove,
}: {
  question: EditorQuestion;
  index: number;
  count: number;
  disabled: boolean;
  onChange: (patch: Partial<Omit<EditorQuestion, 'clientId'>>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Question {index + 1}</div>
        <div className="flex items-center gap-1">
          <IconButton
            label="Move question up"
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Move question down"
            disabled={disabled || index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Remove question"
            disabled={disabled || count <= 1}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Prompt" htmlFor={`question-${index}-prompt`}>
          <Textarea
            id={`question-${index}-prompt`}
            value={question.prompt}
            onChange={(event) => onChange({ prompt: event.target.value })}
            required
            minLength={5}
            maxLength={1000}
            className="min-h-24"
            disabled={disabled}
          />
        </Field>

        <Field
          label="Guidance"
          hint="Optional evaluator or learner context."
          htmlFor={`question-${index}-guidance`}
        >
          <Textarea
            id={`question-${index}-guidance`}
            value={question.guidance}
            onChange={(event) => onChange({ guidance: event.target.value })}
            maxLength={1000}
            disabled={disabled}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Preparation time"
            hint="Seconds"
            htmlFor={`question-${index}-prep`}
          >
            <Input
              id={`question-${index}-prep`}
              type="number"
              min={0}
              max={600}
              value={question.preparationSeconds}
              onChange={(event) =>
                onChange({ preparationSeconds: Number(event.target.value) })
              }
              disabled={disabled}
            />
          </Field>

          <Field
            label="Response time"
            hint="Seconds"
            htmlFor={`question-${index}-response`}
          >
            <Input
              id={`question-${index}-response`}
              type="number"
              min={15}
              max={1800}
              value={question.responseSeconds}
              onChange={(event) =>
                onChange({ responseSeconds: Number(event.target.value) })
              }
              disabled={disabled}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function CriterionEditor({
  criterion,
  index,
  count,
  disabled,
  onChange,
  onRemove,
  onMove,
}: {
  criterion: EditorCriterion;
  index: number;
  count: number;
  disabled: boolean;
  onChange: (patch: Partial<Omit<EditorCriterion, 'clientId'>>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Criterion {index + 1}</div>
        <div className="flex items-center gap-1">
          <IconButton
            label="Move criterion up"
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Move criterion down"
            disabled={disabled || index === count - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Remove criterion"
            disabled={disabled || count <= 1}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1.6fr_8rem]">
        <Field label="Name" htmlFor={`criterion-${index}-name`}>
          <Input
            id={`criterion-${index}-name`}
            value={criterion.name}
            onChange={(event) => onChange({ name: event.target.value })}
            required
            minLength={2}
            maxLength={120}
            disabled={disabled}
          />
        </Field>

        <Field
          label="What good looks like"
          htmlFor={`criterion-${index}-description`}
        >
          <Textarea
            id={`criterion-${index}-description`}
            value={criterion.description}
            onChange={(event) => onChange({ description: event.target.value })}
            required
            minLength={5}
            maxLength={1000}
            disabled={disabled}
          />
        </Field>

        <Field label="Weight" hint="Percent" htmlFor={`criterion-${index}-weight`}>
          <Input
            id={`criterion-${index}-weight`}
            type="number"
            min={0.01}
            max={100}
            step="0.01"
            value={criterion.weight}
            onChange={(event) => onChange({ weight: Number(event.target.value) })}
            required
            disabled={disabled}
          />
        </Field>
      </div>
    </div>
  );
}

function PracticePreview({
  title,
  description,
  scenario,
  instructions,
  difficulty,
  estimatedDurationMinutes,
  questions,
  criteria,
  rubricTotal,
}: {
  title: string;
  description: string;
  scenario: string;
  instructions: string;
  difficulty: string;
  estimatedDurationMinutes: number;
  questions: EditorQuestion[];
  criteria: EditorCriterion[];
  rubricTotal: number;
}) {
  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Learner preview
        </div>
        <CardTitle className="text-2xl">{title || 'Untitled practice'}</CardTitle>
        <CardDescription>{description || 'No description yet.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1">{difficulty}</span>
          <span className="rounded-full bg-muted px-3 py-1">
            ~{estimatedDurationMinutes || 0} min
          </span>
          <span className="rounded-full bg-muted px-3 py-1">
            {questions.length} question{questions.length === 1 ? '' : 's'}
          </span>
        </div>

        <PreviewSection title="Scenario">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {scenario || 'No scenario yet.'}
          </p>
        </PreviewSection>

        {instructions && (
          <PreviewSection title="Instructions">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {instructions}
            </p>
          </PreviewSection>
        )}

        <PreviewSection title="Questions">
          <ol className="space-y-3">
            {questions.map((question, index) => (
              <li key={question.clientId} className="rounded-lg border bg-background p-4">
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  Question {index + 1}
                </div>
                <p className="text-sm font-medium">
                  {question.prompt || 'Question prompt'}
                </p>
              </li>
            ))}
          </ol>
        </PreviewSection>

        <PreviewSection title={`Rubric · ${formatWeight(rubricTotal)}% total`}>
          <div className="grid gap-3 md:grid-cols-2">
            {criteria.map((criterion) => (
              <div key={criterion.clientId} className="rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">
                    {criterion.name || 'Criterion'}
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatWeight(criterion.weight)}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {criterion.description || 'Describe what a strong response shows.'}
                </p>
              </div>
            ))}
          </div>
        </PreviewSection>
      </CardContent>
    </Card>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
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

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function StatusBadge({ status }: { status: Practice['status'] }) {
  const label =
    status === 'published' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft';

  return (
    <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

function formatWeight(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
