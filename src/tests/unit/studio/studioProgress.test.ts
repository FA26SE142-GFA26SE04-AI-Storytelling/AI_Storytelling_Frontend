import { describe, expect, it } from 'vitest';
import { displayedProgress, nextShownStep, STUDIO_STEPS, stepMode, studioActions, studioProgress } from '@/app/features/studio/studioProgress';
import type { StatusSnapshot } from '@/app/features/studio/useStoryPipeline';
import type { ContentGenerationProgressDto, MediaProgressDto } from '@/app/types/aiStory';

const generation = (content: string, stableStoryVersionId: number | null) =>
  ({ content, stableStoryVersionId } as ContentGenerationProgressDto);
const snap = (g: ContentGenerationProgressDto | null): StatusSnapshot => ({ outline: null, generation: g });
const media = (m: Partial<MediaProgressDto>) => ({ isReady: false, errorCode: null, ...m } as MediaProgressDto);

describe('studio progress bar', () => {
  it('maps every pipeline stage to one step', () => {
    expect(studioProgress('brief', null)).toMatchObject({ current: 0, mode: 'you' });
    expect(studioProgress('checking', null)).toMatchObject({ current: 1, mode: 'run' });
    expect(studioProgress('blocked', null)).toMatchObject({ current: 1, mode: 'error' });
    expect(studioProgress('outline_wait', null)).toMatchObject({ current: 2, mode: 'run' });
    expect(studioProgress('outline', null)).toMatchObject({ current: 2, mode: 'you' });
    expect(studioProgress('review', null)).toMatchObject({ current: 5, mode: 'you' });
  });

  it('splits generation into writing and learning materials', () => {
    expect(studioProgress('generating', snap(generation('running', null))).current).toBe(3);
    expect(studioProgress('generating', snap(generation('stable', 9))).current).toBe(4);
  });

  it('follows media progress until the story is ready', () => {
    expect(studioProgress('media', null, media({}))).toMatchObject({ current: 6, mode: 'run' });
    expect(studioProgress('media', null, media({ errorCode: 'x' }))).toMatchObject({ current: 6, mode: 'error' });
    const ready = studioProgress('media', null, media({ isReady: true }));
    expect(ready).toMatchObject({ current: STUDIO_STEPS.length - 1, mode: 'done' });
    expect(STUDIO_STEPS.map((_, i) => stepMode(i, ready)).every((m) => m === 'done')).toBe(true);
  });

  it('turns a running step into an error when the backend reports one', () => {
    expect(studioProgress('outline_wait', null, null, 'timeout')).toMatchObject({ current: 2, mode: 'error' });
    expect(studioProgress('outline', null, null, 'timeout').mode).toBe('you');
  });

  it('marks earlier steps done and later ones todo', () => {
    const p = studioProgress('outline', null);
    expect([0, 1, 2, 3].map((i) => stepMode(i, p))).toEqual(['done', 'done', 'you', 'todo']);
    const stopped = studioProgress('stopped', null);
    expect(stepMode(0, stopped)).toBe('todo');
  });

  it('keeps the controls disabled, with a reason, at the first step and while an AI job is running', () => {
    for (const stage of ['brief', 'checking', 'outline_wait', 'generating'] as const) {
      const a = studioActions(stage);
      expect(a).toMatchObject({ cancelWith: null, editInPlace: false, startNew: false });
      expect(a.waitReason).toBeTruthy();
    }
    expect(studioActions('outline').cancelWith).toBe('reject_outline');
    expect(studioActions('review').cancelWith).toBe('archive');
    expect(studioActions('blocked')).toMatchObject({ editInPlace: true, cancelWith: 'archive' });
    expect(studioActions('media')).toMatchObject({ startNew: true, cancelWith: null });
    // Có thể bấm thì không còn lý do chờ.
    for (const stage of ['outline', 'review', 'blocked', 'media', 'stopped'] as const) expect(studioActions(stage).waitReason).toBeNull();
  });

  it('fills the bar one step at a time and jumps straight back', () => {
    const real = studioProgress('review', null);
    let shown = 2;
    const seen: number[] = [];
    while (shown !== real.current) { shown = nextShownStep(shown, real.current); seen.push(shown); }
    expect(seen).toEqual([3, 4, 5]);
    expect(displayedProgress(real, 3)).toMatchObject({ current: 3, mode: 'run' });
    expect(displayedProgress(real, 5)).toBe(real);
    expect(nextShownStep(5, 0)).toBe(0);
    expect(nextShownStep(5, -1)).toBe(-1);
  });
});
