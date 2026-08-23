export class PracticeRunLimitError extends Error {
  readonly code = 'practice_run_limit' as const;

  constructor(
    readonly funderUserId: string,
    readonly plan: 'free' | 'pro',
    readonly used: number,
    readonly limit: number,
  ) {
    super('The Practice owner has reached their monthly Practice run limit.');
    this.name = 'PracticeRunLimitError';
  }
}
