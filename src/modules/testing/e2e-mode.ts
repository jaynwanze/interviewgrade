import 'server-only';

/**
 * Deterministic provider behavior used only by local/CI end-to-end tests.
 *
 * The NODE_ENV guard is deliberate: setting the feature flag alone can never
 * enable fake AI behavior in a production or preview deployment.
 */
export function isInterviewGradeE2EMode(): boolean {
  return (
    process.env.NODE_ENV === 'test' &&
    process.env.INTERVIEWGRADE_E2E_FAKE_AI === '1'
  );
}
