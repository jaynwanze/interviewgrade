'use client';

import { Loader2, WandSparkles } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { generatePracticeDraftAction } from './actions';

export function GeneratePracticeDraftForm() {
  return (
    <form action={generatePracticeDraftAction} className="space-y-5">
      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="brief" className="text-sm font-medium">
            What do you want to practise?
          </label>
          <p className="text-xs text-muted-foreground">
            Describe a role, skill, scenario, presentation, viva, sales call, or
            paste a job description. InterviewGrade will turn it into an editable
            draft.
          </p>
        </div>
        <Textarea
          id="brief"
          name="brief"
          required
          minLength={20}
          maxLength={12000}
          className="min-h-40"
          placeholder="Example: I am preparing for a senior Java backend interview at a fintech company. Focus on system design, concurrency, APIs, trade-offs, and communicating technical decisions. Make the questions challenging but realistic."
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <label htmlFor="questionCount" className="text-sm font-medium">
            Questions
          </label>
          <select
            id="questionCount"
            name="questionCount"
            defaultValue="5"
            className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="3">3 questions</option>
            <option value="4">4 questions</option>
            <option value="5">5 questions</option>
            <option value="6">6 questions</option>
            <option value="7">7 questions</option>
            <option value="8">8 questions</option>
          </select>
        </div>

        <GenerateButton />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        AI only creates the draft. Review and edit the questions, rubric, weights,
        mappings, timings, and scenario before you choose Publish.
      </p>
    </form>
  );
}

function GenerateButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="sm:min-w-48">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <WandSparkles className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Generating draft…' : 'Generate with AI'}
    </Button>
  );
}
