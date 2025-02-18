'use server';

export async function unlockCandidateAction(employerId: string, candidateId: string) {
  // 1) fetch tokens for employer
  // 2) if tokens < 1 => throw error
  // 3) decrement token
  // 4) insert into employee_candidate_unlocks
  // 5) return success
}
