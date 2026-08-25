export function canUseCoachForSession(
  participantUserId: string | null | undefined,
  userId: string,
): boolean {
  return Boolean(participantUserId && participantUserId === userId);
}
