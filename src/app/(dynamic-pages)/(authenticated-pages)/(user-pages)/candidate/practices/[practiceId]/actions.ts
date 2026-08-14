'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

const editorQuestionSchema = z.object({
  prompt: z.string().trim().min(5).max(1000),
  guidance: z.string().trim().max(1000).nullable(),
  preparationSeconds: z.number().int().min(0).max(600),
  responseSeconds: z.number().int().min(15).max(1800),
});

const editorCriterionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(1000),
  weight: z.number().positive().max(100),
});

const editorDraftSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1000),
  scenario: z.string().trim().min(10).max(2000),
  instructions: z.string().trim().max(2000).nullable(),
  difficulty: z.string().trim().max(80).nullable(),
  estimatedDurationMinutes: z.number().int().min(1).max(240).nullable(),
  questions: z.array(editorQuestionSchema).min(1).max(50),
  rubricCriteria: z.array(editorCriterionSchema).min(1).max(30),
});

type EditorIntent = 'save' | 'publish';

function errorUrl(practiceId: string, code: string) {
  return `/candidate/practices/${practiceId}?error=${encodeURIComponent(code)}`;
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function nullableString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function nullablePositiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : Number.NaN;
}

export async function updatePracticeDraftAction(
  practiceId: string,
  formData: FormData,
) {
  await serverGetLoggedInUser();

  const intent: EditorIntent =
    formData.get('intent') === 'publish' ? 'publish' : 'save';

  const parsed = editorDraftSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    scenario: formData.get('scenario'),
    instructions: nullableString(formData.get('instructions')),
    difficulty: nullableString(formData.get('difficulty')),
    estimatedDurationMinutes: nullablePositiveInteger(
      formData.get('estimatedDurationMinutes'),
    ),
    questions: parseJsonField(formData.get('questionsJson')),
    rubricCriteria: parseJsonField(formData.get('rubricJson')),
  });

  if (!parsed.success) {
    redirect(errorUrl(practiceId, 'invalid'));
  }

  if (intent === 'publish') {
    const total = parsed.data.rubricCriteria.reduce(
      (sum, criterion) => sum + criterion.weight,
      0,
    );

    if (Math.abs(total - 100) > 0.01) {
      redirect(errorUrl(practiceId, 'weights'));
    }
  }

  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();

    await service.updateDraft(practiceId, {
      title: parsed.data.title,
      description: parsed.data.description,
      scenario: parsed.data.scenario,
      instructions: parsed.data.instructions,
      difficulty: parsed.data.difficulty,
      estimatedDurationMinutes: parsed.data.estimatedDurationMinutes,
      questions: parsed.data.questions.map((question, index) => ({
        order: index,
        prompt: question.prompt,
        guidance: question.guidance,
        preparationSeconds: question.preparationSeconds,
        responseSeconds: question.responseSeconds,
      })),
      rubricCriteria: parsed.data.rubricCriteria.map((criterion, index) => ({
        order: index,
        name: criterion.name,
        description: criterion.description,
        weight: criterion.weight,
      })),
    });

    if (intent === 'publish') {
      await service.publish(practiceId);
    }
  } catch (error) {
    console.error('updatePracticeDraftAction: v2 practice persistence failed', error);
    redirect(errorUrl(practiceId, 'unavailable'));
  }

  revalidatePath('/candidate/practices');
  revalidatePath(`/candidate/practices/${practiceId}`);

  redirect(
    `/candidate/practices/${practiceId}?${
      intent === 'publish' ? 'published=1' : 'saved=1'
    }`,
  );
}
