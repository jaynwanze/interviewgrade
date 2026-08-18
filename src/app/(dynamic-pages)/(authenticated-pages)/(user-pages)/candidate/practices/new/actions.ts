'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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

export async function generatePracticeDraftAction(formData: FormData) {
  // AI generation creates persisted candidate content, so authentication is
  // required before either the model call or the database mutation.
  await serverGetLoggedInUser();

  const parsed = generatePracticeFormSchema.safeParse({
    brief: formData.get('brief'),
    questionCount: formData.get('questionCount'),
  });

  if (!parsed.success) {
    redirect('/candidate/practices/new?error=ai-input');
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

  let createdPracticeId: string | null = null;

  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const created = await service.create(generatedDraft);
    createdPracticeId = created.id;
  } catch (error) {
    console.error(
      'generatePracticeDraftAction: generated practice persistence unavailable',
      error,
    );
  }

  if (!createdPracticeId) {
    redirect('/candidate/practices/new?error=unavailable');
  }

  revalidatePath('/candidate/practices');
  redirect(`/candidate/practices/${createdPracticeId}?generated=1`);
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
