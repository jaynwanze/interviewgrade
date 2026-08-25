import { describe, expect, it } from 'vitest';

import { canUseCoachForSession } from './coach.authorization';

describe('canUseCoachForSession', () => {
  it('allows only the signed-in participant who owns the session', () => {
    expect(canUseCoachForSession('user-1', 'user-1')).toBe(true);
    expect(canUseCoachForSession('user-1', 'user-2')).toBe(false);
    expect(canUseCoachForSession(null, 'user-1')).toBe(false);
    expect(canUseCoachForSession(undefined, 'user-1')).toBe(false);
  });
});
