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
import { v4 as uuidv4 } from 'uuid';

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
  id: string;
  prompt: string;
  guidance: string;
  preparationSeconds: number;
  responseSeconds: number;
  rubricCriterionIds: string[];
};

type EditorCriterion = {
  id: string;
  name: string;
  description: string;
  weight: number;
};

export function PracticeEditor({ practice }: { practice: Practice }) {
  const initialCriteria: EditorCriterion[] = practice.draft.rubricCriteria.map(
    (criterion) => ({
      id: criterion.id ?? uuidv4(),
      name: criterion.name,
      description: criterion.description,
      weight: criterion.weight,
    }),
  );
  const initialCriterionIds = initialCriteria.map((criterion) => criterion.id);

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
  const [criteria, setCriteria] = useState<EditorCriterion[]>(initialCriteria);
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    practice.draft.questions.map((question) => ({
      id: question.id ?? uuidv4(),
      prompt: question.prompt,
      guidance: question.guidance ?? '',
      preparationSeconds: question.preparationSeconds ?? 30,
      responseSeconds: question.responseSeconds ?? 120,
      rubricCriterionIds:
        question.rubricCriterionIds?.length
          ? question.rubricCriterionIds
          : initialCriterionIds,
    })),
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const rubricTotal = useMemo(
    () => criteria.reduce((sum, criterion) => sum + (criterion.weight || 0), 0),
    [criteria],
  );
  const rubricReady = Math.abs(rubricTotal - 100) <= 0.01;
  const unusedCriteria = useMemo(
    () =>
      criteria.filter(
        (criterion) =>
          !questions.some((question) =>
            question.rubricCriterionIds.includes(criterion.id),
          ),
      ),
    [criteria, questions],
  );
  const mappingsReady =
    questions.every((question) => question.rubricCriterionIds.length > 0) &&
    unusedCriteria.length === 0;
  const archived = practice.status === 'archived';
  const submitAction = updatePracticeDraftAction.bind(null, practice.id);

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        id: uuidv4(),
        prompt: '',
        guidance: '',
        preparationSeconds: 30,
        responseSeconds: 120,
        rubricCriterionIds: criteria.map((criterion) => criterion.id),
      },
    ]);
  }

  function updateQuestion(
    index: number,
    patch: Partial<Omit<EditorQuestion, 'id'>>,
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function toggleQuestionCriterion(
    questionIndex: number,
    criterionId: string,
    checked: boolean,
  ) {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;

        if (checked) {
          return question.rubricCriterionIds.includes(criterionId)
            ? question
            : {
                ...question,
                rubricCriterionIds: [...question.rubricCriterionIds, criterionId],
              };
        }

        if (question.rubricCriterionIds.length <= 1) {
          return question;
        }

        return {
          ...question,
          rubricCriterionIds: question.rubricCriterionIds.filter(
            (id) => id !== criterionId,
          ),
        };
      }),
    );
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((current) => moveItem(current, index, direction));
  }

  function addCriterion() {
    const criterion: EditorCriterion = {
      id: uuidv4(),
      name: '',
      description: '',
      weight: 0,
    };

    setCriteria((current) => [...current, criterion]);
    setQuestions((current) =>
      current.map((question) => ({
        ...question,
        rubricCriterionIds: [...question.rubricCriterionIds, criterion.id],
      })),
    );
  }

  function updateCriterion(
    index: number,
    patch: Partial<Omit<EditorCriterion, 'id'>>,
  ) {
    setCriteria((current) =>
      current.map((criterion, criterionIndex) =>
        criterionIndex === index ? { ...criterion, ...patch } : criterion,
      ),
    );
  }

  function removeCriterion(index: number) {
    const removed = criteria[index];
    const remaining = criteria.filter((_, itemIndex) => itemIndex !== index);
    if (!removed || remaining.length === 0) return;

    setCriteria(remaining);
    setQuestions((current) =>
      current.map((question) => {
        const mapped = question.rubricCriterionIds.filter(
          (criterionId) => criterionId !== removed.id,
        );
        return {
          ...question,
          rubricCriterionIds: mapped.length > 0 ? mapped : [remaining[0].id],
        };
      }),
    );
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
            questions.map((question) => ({
              ...question,
              guidance: question.guidance.trim() || null,
            })),
          )}
        />
        <input
          type="hidden"
          name="rubricJson"
          value={JSON.stringify(criteria)}
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
                  Set the learner order and choose exactly which rubric criteria
                  should score each response.
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
                key={question.id}
                question={question}
                criteria={criteria}
                index={index}
                count={questions.length}
                disabled={archived}
                onChange={(patch) => updateQuestion(index, patch)}
                onToggleCriterion={(criterionId, checked) =>
                  toggleQuestionCriterion(index, criterionId, checked)
                }
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
                  requires 100% total weight and every criterion to be used by at
                  least one question.
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
                key={criterion.id}
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

            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                mappingsReady
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">Question scoring coverage</span>
                <span className="font-semibold">
                  {mappingsReady ? 'Ready' : 'Needs attention'}
                </span>
              </div>
              {!mappingsReady && unusedCriteria.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Map {unusedCriteria.map((criterion) => criterion.name || 'Unnamed criterion').join(', ')}
                  {' '}to at least one question before publishing.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Save keeps the draft private. Publish freezes the questions, mappings,
            and rubric for reproducible sessions.
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
              disabled={archived || !rubricReady || !mappingsReady}
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
  criteria,
  index,
  count,
  disabled,
  onChange,
  onToggleCriterion,
  onRemove,
  onMove,
}: {
  question: EditorQuestion;
  criteria: EditorCriterion[];
  index: number;
  count: number;
  disabled: boolean;
  onChange: (patch: Partial<Omit<EditorQuestion, 'id'>>) => void;
  onToggleCriterion: (criterionId: string, checked: boolean) => void;
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

        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium">Scored against</div>
            <p className="text-xs text-muted-foreground">
              Select the rubric criteria that are relevant to this question. At
              least one criterion must remain selected.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {criteria.map((criterion, criterionIndex) => {
              const checked = question.rubricCriterionIds.includes(criterion.id);
              const lastSelected = checked && question.rubricCriterionIds.length === 1;
              return (
                <label
                  key={criterion.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/10 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={checked}
                    disabled={disabled || lastSelected}
                    onChange={(event) =>
                      onToggleCriterion(criterion.id, event.target.checked)
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-medium">
                      <span>{criterion.name || `Criterion ${criterionIndex + 1}`}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatWeight(criterion.weight)}%
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {criterion.description || 'Describe what a strong response shows.'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
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
  onChange: (patch: Partial<Omit<EditorCriterion, 'id'>>) => void;
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
  const criteriaById = new Map(criteria.map((criterion) => [criterion.id, criterion]));

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
              <li key={question.id} className="rounded-lg border bg-background p-4">
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  Question {index + 1}
                </div>
                <p className="text-sm font-medium">
                  {question.prompt || 'Question prompt'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {question.rubricCriterionIds.map((criterionId) => {
                    const criterion = criteriaById.get(criterionId);
                    return criterion ? (
                      <span
                        key={criterionId}
                        className="rounded-full border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        {criterion.name || 'Criterion'}
                      </span>
                    ) : null;
                  })}
                </div>
              </li>
            ))}
          </ol>
        </PreviewSection>

        <PreviewSection title={`Rubric · ${formatWeight(rubricTotal)}% total`}>
          <div className="grid gap-3 md:grid-cols-2">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="rounded-lg border bg-background p-4">
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
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

function formatWeight(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
