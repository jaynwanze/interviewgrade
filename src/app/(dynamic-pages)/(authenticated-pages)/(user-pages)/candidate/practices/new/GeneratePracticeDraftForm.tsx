'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { generatePracticeDraftAction } from './actions';

export function GeneratePracticeDraftForm() {
  return (
    <form action={generatePracticeDraftAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="brief" className="text-sm font-medium">
          What are you preparing for?
        </label>
        <Textarea
          id="brief"
          name="brief"
          required
          minLength={20}
          maxLength={12000}
          className="min-h-32"
          placeholder="Role, skills, scenario, or paste a job description…"
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <label htmlFor="questionCount" className="text-xs font-medium text-muted-foreground">
            Questions
          </label>
          <select
            id="questionCount"
            name="questionCount"
            defaultValue="5"
            className="flex h-9 w-36 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    </form>
  );
}

function GenerateButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} size="sm" className="sm:min-w-40">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      {pending ? 'Creating…' : 'Create draft'}
    </Button>
  );
}
