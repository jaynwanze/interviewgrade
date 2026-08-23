'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type RetirePracticeActionResult =
  | { success: true; mode: 'deleted' | 'archived' }
  | { success: false; message: string };

export async function retirePracticeAction(
  practiceId: string,
): Promise<RetirePracticeActionResult> {
  const parsed = z.string().uuid().safeParse(practiceId);
  if (!parsed.success) {
    return { success: false, message: 'This Practice could not be retired.' };
  }

  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const mode = await service.retire(parsed.data);

    revalidatePath('/candidate/practices');
    revalidatePath(`/candidate/practices/${parsed.data}`);
    revalidatePath(`/candidate/practices/${parsed.data}/results`);

    return { success: true, mode };
  } catch (error) {
    console.error('retirePracticeAction: could not retire Practice', error);
    return {
      success: false,
      message: 'This Practice could not be removed right now. Please try again.',
    };
  }
}
