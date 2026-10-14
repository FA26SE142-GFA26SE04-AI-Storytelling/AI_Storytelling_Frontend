import { describe, expect, it } from 'vitest';
import { startPolling } from '@/app/features/story-workflow/useStoryProgressPolling';

describe('startPolling', () => {
  const current = { scope: 7, data: { stage: 'review' }, error: 'cũ', timedOut: true };

  it('keeps the last data when the same story is refreshed, so the screen does not fall back to an empty state', () => {
    expect(startPolling(current, 7)).toEqual({ scope: 7, data: { stage: 'review' }, error: null, timedOut: false });
  });

  it('starts clean for a different story or when polling begins', () => {
    expect(startPolling(current, 8)).toEqual({ scope: 8, data: null, error: null, timedOut: false });
    expect(startPolling({ scope: null, data: null, error: null, timedOut: false }, 7).data).toBeNull();
  });
});
