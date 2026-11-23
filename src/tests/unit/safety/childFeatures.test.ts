import { describe, expect, it } from 'vitest';
import { CHILD_FEATURE_TOGGLES, readChildFeatures } from '@/app/features/safety/childFeatures';

describe('child feature toggles', () => {
  it('lists the five new per-child switches in order', () => {
    expect(CHILD_FEATURE_TOGGLES.map((t) => t.field)).toEqual(
      ['quizEnabled', 'notebookEnabled', 'libraryBrowseEnabled', 'reflectionEnabled', 'rewardsEnabled']);
  });

  it('warns that turning quiz off stops EXP and roadmap progress from quizzes', () => {
    expect(CHILD_FEATURE_TOGGLES.find((t) => t.field === 'quizEnabled')?.warning)
      .toBe('Tắt câu đố thì EXP và tiến độ lộ trình từ câu đố không được tính.');
  });

  it('treats missing fields (old backend or no policy) as enabled', () => {
    expect(readChildFeatures(null)).toEqual({
      quizEnabled: true, notebookEnabled: true, libraryBrowseEnabled: true, reflectionEnabled: true, rewardsEnabled: true,
    });
    expect(readChildFeatures({ quizEnabled: false })).toMatchObject({ quizEnabled: false, rewardsEnabled: true });
  });
});
