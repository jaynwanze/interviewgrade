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
          <label htmlFor="contextKind" className="text-sm font-medium">
            What are you uploading?
          </label>
          <p className="text-xs text-muted-foreground">
            Tell InterviewGrade how to use the source so the generated Practice is
            tailored appropriately.
          </p>
        </div>
        <select
          id="contextKind"
          name="contextKind"
          defaultValue="job-description"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-xs"
        >
          <option value="job-description">Job description</option>
          <option value="resume">Résumé / CV</option>
          <option value="other">Other source document</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="document" className="text-sm font-medium">
            Practice context
          </label>
          <p className="text-xs text-muted-foreground">
            Text-based PDF or TXT, up to 5 MB. The file and extracted text are used
            only for this generation request and are not stored by this flow.
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
            Optional focus
          </label>
          <p className="text-xs text-muted-foreground">
            Add any role, skill, scenario, or interview focus you want emphasized.
          </p>
        </div>
        <Textarea
          id="documentInstruction"
          name="instruction"
          maxLength={1500}
          className="min-h-28"
          placeholder="Example: Focus on stakeholder communication, decision making, and the most important requirements for this role."
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
        You can review and edit everything before publishing. Résumé-based generation
        is instructed to use only experience explicitly present in your source.
      </p>
    </form>
  );
}

function GenerateDocumentButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="sm:min-w-48">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Creating draft…' : 'Create from context'}
    </Button>
  );
}
