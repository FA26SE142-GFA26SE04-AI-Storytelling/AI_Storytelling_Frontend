import { describe, expect, it } from 'vitest';
import { nextPollDelay } from '@/app/features/story-workflow/useStoryProgressPolling';

describe('nextPollDelay', () => {
  it('stops when the backend reports a final state', () => {
    expect(nextPollDelay(false, 0, 600_000, 15_000)).toEqual({ timedOut: false, delay: null });
  });
  it('polls quickly before the timeout', () => {
    expect(nextPollDelay(true, 599_999, 600_000, 15_000)).toEqual({ timedOut: false, delay: 1800 });
  });
  it('keeps the old behaviour (stop and report timedOut) without a slow interval', () => {
    expect(nextPollDelay(true, 600_000, 600_000)).toEqual({ timedOut: true, delay: null });
  });
  it('keeps polling slowly after the timeout so a long media job does not leave the screen stuck', () => {
    // Story 89: TTS bị giới hạn lượt, job gói media chạy 3 giờ; dừng sau 10 phút làm màn hình kẹt ở "Đang vẽ tranh".
    expect(nextPollDelay(true, 3 * 60 * 60_000, 600_000, 15_000)).toEqual({ timedOut: false, delay: 15_000 });
  });
});
