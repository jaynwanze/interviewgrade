'use client';

import { FileText, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { generatePracticeDraftFromDocumentAction } from './actions';

export function UploadPracticeDocumentForm() {
  return (
    <form action={generatePracticeDraftFromDocumentAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <div className="space-y-1.5">
          <label htmlFor="contextKind" className="text-xs font-medium text-muted-foreground">
            Source type
          </label>
          <select
            id="contextKind"
            name="contextKind"
            defaultValue="job-description"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="job-description">Job description</option>
            <option value="resume">Résumé / CV</option>
            <option value="other">Other document</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="document" className="text-xs font-medium text-muted-foreground">
            PDF or TXT · max 5 MB
          </label>
          <input
            id="document"
            name="document"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            required
            className="block h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-medium"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="documentInstruction" className="text-sm font-medium">
          Optional focus
        </label>
        <Textarea
          id="documentInstruction"
          name="instruction"
          maxLength={1500}
          className="min-h-20"
          placeholder="Stakeholder communication, technical depth, leadership…"
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <label htmlFor="documentQuestionCount" className="text-xs font-medium text-muted-foreground">
            Questions
          </label>
          <select
            id="documentQuestionCount"
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

        <GenerateDocumentButton />
      </div>

      <p className="text-[11px] leading-4 text-muted-foreground">
        Used for generation only. The source file is not stored.
      </p>
    </form>
  );
}

function GenerateDocumentButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} size="sm" className="sm:min-w-40">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      {pending ? 'Creating…' : 'Upload material'}
    </Button>
  );
}
