'use client';

import { FileText, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { generatePracticeDraftFromDocumentAction } from './actions';

export function UploadPracticeDocumentForm() {
  return (
    <form action={generatePracticeDraftFromDocumentAction} className="space-y-5">
      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="document" className="text-sm font-medium">
            Source document
          </label>
          <p className="text-xs text-muted-foreground">
            Upload a text-based PDF or TXT file up to 5 MB. The file is read
            server-side to create the draft and is not stored by this flow.
          </p>
        </div>
        <input
          id="document"
          name="document"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="documentInstruction" className="text-sm font-medium">
            Optional instruction
          </label>
          <p className="text-xs text-muted-foreground">
            Tell InterviewGrade what kind of spoken Practice to create from the
            source material.
          </p>
        </div>
        <Textarea
          id="documentInstruction"
          name="instruction"
          maxLength={1500}
          className="min-h-28"
          placeholder="Example: Turn this job description into a 5-question technical interview practice focused on the most important requirements."
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <label htmlFor="documentQuestionCount" className="text-sm font-medium">
            Questions
          </label>
          <select
            id="documentQuestionCount"
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

        <GenerateDocumentButton />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Nothing is published automatically. After generation you will land in the
        same editor where every question, rubric criterion, mapping, and timing can
        be changed before Publish.
      </p>
    </form>
  );
}

function GenerateDocumentButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="sm:min-w-52">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Reading & generating…' : 'Generate from document'}
    </Button>
  );
}
