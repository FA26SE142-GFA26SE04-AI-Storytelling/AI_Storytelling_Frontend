import { describe, expect, it } from 'vitest';
import { startPolling, transientPollingFailure } from '@/app/features/story-workflow/useStoryProgressPolling';

describe('startPolling', () => {
  it('reconnects for transient reads while respecting authorization and invalid requests',()=>{
    for(const status of [0,408,429,500,502,503,504])expect(transientPollingFailure(status)).toBe(true);
    for(const status of [undefined,400,401,403,404,409])expect(transientPollingFailure(status)).toBe(false);
  });
  const current = { scope: 7, data: { stage: 'review' }, error: 'cũ', timedOut: true };

  it('keeps the last data when the same story is refreshed, so the screen does not fall back to an empty state', () => {
    expect(startPolling(current, 7)).toEqual({ scope: 7, data: { stage: 'review' }, error: null, timedOut: false });
  });

  it('starts clean for a different story or when polling begins', () => {
    expect(startPolling(current, 8)).toEqual({ scope: 8, data: null, error: null, timedOut: false });
    expect(startPolling({ scope: null, data: null, error: null, timedOut: false }, 7).data).toBeNull();
  });
});
