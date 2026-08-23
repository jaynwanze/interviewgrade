'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { reserveV2PracticeGeneration } from '@/modules/billing/v2-practice-generation-usage';
import type { PracticeDraft } from '@/modules/practice/practice.schema';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

const createPracticeFormSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1000),
  scenario: z.string().trim().min(10).max(1500),
  question: z.string().trim().min(5).max(1000),
  rubricName: z.string().trim().min(2).max(120),
  rubricDescription: z.string().trim().min(5).max(1000),
});

const generatePracticeFormSchema = z.object({
  brief: z.string().trim().min(20).max(12000),
  questionCount: z.coerce.number().int().min(3).max(8),
});

const generateDocumentPracticeFormSchema = z.object({
  instruction: z.string().trim().max(1500),
  questionCount: z.coerce.number().int().min(3).max(8),
});

export async function generatePracticeDraftAction(formData: FormData) {
  // AI generation creates persisted candidate content, so authentication is
  // required before either the model call or the database mutation.
  const user = await serverGetLoggedInUser();

  const parsed = generatePracticeFormSchema.safeParse({
    brief: formData.get('brief'),
    questionCount: formData.get('questionCount'),
  });

  if (!parsed.success) {
    redirect('/candidate/practices/new?error=ai-input');
  }

  let generationAllowed = false;

  try {
    const reservation = await reserveV2PracticeGeneration(user.id, 'brief');
    generationAllowed = reservation.allowed;
  } catch (error) {
    console.error(
      'generatePracticeDraftAction: AI generation allowance unavailable',
      error,
    );
    redirect('/candidate/practices/new?error=ai');
  }

  if (!generationAllowed) {
    redirect('/candidate/practices/new?error=ai-limit');
  }

  let generatedDraft: PracticeDraft | null = null;

  try {
    const { generatePracticeDraft } = await import(
      '@/modules/practice/practice.generator'
    );
    generatedDraft = await generatePracticeDraft(parsed.data);
  } catch (error) {
    console.error(
      'generatePracticeDraftAction: AI practice drafting unavailable',
      error,
    );
  }

  if (!generatedDraft) {
    redirect('/candidate/practices/new?error=ai');
  }

  const createdPracticeId = await persistGeneratedDraft(generatedDraft);

  if (!createdPracticeId) {
    redirect('/candidate/practices/new?error=unavailable');
  }

  revalidatePath('/candidate/practices');
  revalidatePath('/candidate/settings/billing');
  redirect(`/candidate/practices/${createdPracticeId}?generated=1`);
}

export async function generatePracticeDraftFromDocumentAction(
  formData: FormData,
) {
  const user = await serverGetLoggedInUser();

  const document = formData.get('document');
  const parsed = generateDocumentPracticeFormSchema.safeParse({
    instruction: formData.get('instruction') ?? '',
    questionCount: formData.get('questionCount'),
  });

  if (!(document instanceof File) || !parsed.success) {
    redirect('/candidate/practices/new?error=document-input');
  }

  let extracted: { filename: string; text: string } | null = null;
  let documentError: string | null = null;

  const documentSource = await import('@/modules/practice/document-source');

  try {
    extracted = await documentSource.extractPracticeDocument(document);
  } catch (error) {
    if (error instanceof documentSource.PracticeDocumentError) {
      documentError = mapDocumentError(error.code);
    } else {
      console.error(
        'generatePracticeDraftFromDocumentAction: document extraction failed',
        error,
      );
      documentError = 'document';
    }
  }

  if (!extracted) {
    redirect(`/candidate/practices/new?error=${documentError ?? 'document'}`);
  }

  let generationAllowed = false;

  try {
    const reservation = await reserveV2PracticeGeneration(user.id, 'document');
    generationAllowed = reservation.allowed;
  } catch (error) {
    console.error(
      'generatePracticeDraftFromDocumentAction: AI generation allowance unavailable',
      error,
    );
    redirect('/candidate/practices/new?error=document-ai');
  }

  if (!generationAllowed) {
    redirect('/candidate/practices/new?error=ai-limit');
  }

  let generatedDraft: PracticeDraft | null = null;

  try {
    const { generatePracticeDraftFromSource } = await import(
      '@/modules/practice/practice.document-generator'
    );
    generatedDraft = await generatePracticeDraftFromSource({
      sourceText: extracted.text,
      sourceLabel: extracted.filename,
      instruction: parsed.data.instruction,
      questionCount: parsed.data.questionCount,
    });
  } catch (error) {
    console.error(
      'generatePracticeDraftFromDocumentAction: AI practice drafting unavailable',
      error,
    );
  }

  if (!generatedDraft) {
    redirect('/candidate/practices/new?error=document-ai');
  }

  const createdPracticeId = await persistGeneratedDraft(generatedDraft);

  if (!createdPracticeId) {
    redirect('/candidate/practices/new?error=unavailable');
  }

  revalidatePath('/candidate/practices');
  revalidatePath('/candidate/settings/billing');
  redirect(`/candidate/practices/${createdPracticeId}?generated=1&document=1`);
}

export async function createPracticeAction(formData: FormData) {
  // Keep authentication redirects outside the persistence error boundary.
  await serverGetLoggedInUser();

  const parsed = createPracticeFormSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    scenario: formData.get('scenario'),
    question: formData.get('question'),
    rubricName: formData.get('rubricName'),
    rubricDescription: formData.get('rubricDescription'),
  });

  if (!parsed.success) {
    redirect('/candidate/practices/new?error=invalid');
  }

  let createdPracticeId: string | null = null;

  try {
    // Dynamic import keeps the existing candidate shell buildable in an
    // environment where the v2 DATABASE_URL has not been configured yet.
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const questionId = randomUUID();
    const criterionId = randomUUID();

    const created = await service.create({
      title: parsed.data.title,
      description: parsed.data.description,
      scenario: parsed.data.scenario,
      instructions: null,
      difficulty: 'Medium',
      estimatedDurationMinutes: 10,
      questions: [
        {
          id: questionId,
          order: 0,
          prompt: parsed.data.question,
          guidance: null,
          preparationSeconds: 30,
          responseSeconds: 120,
          rubricCriterionIds: [criterionId],
        },
      ],
      rubricCriteria: [
        {
          id: criterionId,
          order: 0,
          name: parsed.data.rubricName,
          description: parsed.data.rubricDescription,
          weight: 100,
        },
      ],
    });

    createdPracticeId = created.id;
  } catch (error) {
    console.error('createPracticeAction: v2 practice persistence unavailable', error);
  }

  if (!createdPracticeId) {
    redirect('/candidate/practices/new?error=unavailable');
  }

  revalidatePath('/candidate/practices');
  redirect(`/candidate/practices/${createdPracticeId}?created=1`);
}

async function persistGeneratedDraft(draft: PracticeDraft) {
  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const created = await service.create(draft);
    return created.id;
  } catch (error) {
    console.error('persistGeneratedDraft: practice persistence unavailable', error);
    return null;
  }
}

function mapDocumentError(code: string) {
  switch (code) {
    case 'unsupported-type':
      return 'document-type';
    case 'too-large':
      return 'document-size';
    case 'empty':
      return 'document-empty';
    case 'too-much-text':
      return 'document-length';
    default:
      return 'document';
  }
}
