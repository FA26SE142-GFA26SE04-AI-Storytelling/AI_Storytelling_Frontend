import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  childDraftKey, readChildDraft, removeChildDraft, writeChildDraft,
  type ChildDraft,
} from '@/app/features/children/childrenIntent';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    get length() { return values.size; },
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

const draft: ChildDraft = {
  step: 2,
  nickname: 'Bé Na',
  ageBand: 'Age_9_10',
  learning: { readingLevel: 3, readingMode: 'Independent', comprehensionGoal: 'Hiểu ý chính', favorites: ['Khủng long'], focus: [] },
  rules: { 4: 'Blocked', 7: 'Allowed' },
  gate: false,
  createdId: null,
};

describe('child create wizard draft', () => {
  it('restores every filled field after a reload, isolated by account', () => {
    writeChildDraft(1, draft);
    expect(readChildDraft(1, 3)).toEqual(draft);
    expect(readChildDraft(2, 3)).toBeNull();
  });
  it('never stores the consent checkbox', () => {
    writeChildDraft(1, { ...draft, consent: true } as ChildDraft);
    expect(sessionStorage.getItem(childDraftKey(1))).not.toContain('consent');
  });
  it('keeps the created profile id so finishing again does not create a duplicate', () => {
    writeChildDraft(1, { ...draft, step: 3, createdId: 42 });
    expect(readChildDraft(1, 3)?.createdId).toBe(42);
  });
  it('rejects corrupted or out-of-range drafts', () => {
    sessionStorage.setItem(childDraftKey(1), '{broken');
    expect(readChildDraft(1, 3)).toBeNull();
    writeChildDraft(1, { ...draft, step: 9 });
    expect(readChildDraft(1, 3)).toBeNull();
    writeChildDraft(1, { ...draft, ageBand: 'Age_99' });
    expect(readChildDraft(1, 3)).toBeNull();
    writeChildDraft(1, { ...draft, createdId: -5 });
    expect(readChildDraft(1, 3)).toBeNull();
    sessionStorage.setItem(childDraftKey(1), JSON.stringify({ v: 0, ...draft }));
    expect(readChildDraft(1, 3)).toBeNull();
  });
  it('keeps a story length the parent adjusted and falls back to the suggestion when it is invalid', () => {
    writeChildDraft(1, { ...draft, maxLength: 1200 });
    expect(readChildDraft(1, 3)?.maxLength).toBe(1200);
    writeChildDraft(1, { ...draft, maxLength: 99999 });
    expect(readChildDraft(1, 3)).toEqual(draft);
    expect(readChildDraft(1, 3)?.maxLength).toBeUndefined();
  });
  it('keeps the time & habits form and the skip choice, and reloads the suggestion when the form is corrupted', () => {
    const value = {
      enabled: true, weekday: [{ start: '18:00', end: '20:00' }], weekend: [], bedtimeWeekday: '20:30', bedtimeWeekend: '',
      breakEnabled: true, breakAfterMinutes: 20, breakDurationMinutes: 5, breakRemindEyes: true, breakRemindWater: true, breakRemindMove: true,
      screenLimitEnabled: true, screenLimitWeekdayMinutes: 45, screenLimitWeekendMinutes: 90,
      habitEnabled: false, readingReminderWeekday: '19:00', readingReminderWeekend: '09:00', weeklyGoalDays: 3,
    };
    const time = { ageBand: 'Age_6_8', value, edited: true };
    writeChildDraft(1, { ...draft, step: 4, time, skipTime: false });
    expect(readChildDraft(1, 4)).toEqual({ ...draft, step: 4, time, skipTime: false });
    writeChildDraft(1, { ...draft, skipTime: true });
    expect(readChildDraft(1, 4)?.skipTime).toBe(true);
    sessionStorage.setItem(childDraftKey(1), JSON.stringify({ v: 1, ...draft, time: { ageBand: 'Age_6_8', value: { enabled: 'x' }, edited: true } }));
    expect(readChildDraft(1, 4)).toEqual(draft);
  });
  it('keeps age, grade and avatar, and drops each one alone when it is invalid', () => {
    // draft.ageBand là Age_9_10: tuổi 9 khớp, tuổi 7 không khớp nên bị bỏ.
    writeChildDraft(1, { ...draft, age: 9, grade: 4, avatarId: 'avatar-fox' });
    expect(readChildDraft(1, 3)).toEqual({ ...draft, age: 9, grade: 4, avatarId: 'avatar-fox' });
    writeChildDraft(1, { ...draft, age: 7, grade: 9, avatarId: 'avatar-dragon' });
    expect(readChildDraft(1, 3)).toEqual(draft);
  });
  it('drops unknown category rules instead of failing the whole draft', () => {
    sessionStorage.setItem(childDraftKey(1), JSON.stringify({ v: 1, ...draft, rules: { 4: 'Blocked', x: 'Blocked', 5: 'Maybe' } }));
    expect(readChildDraft(1, 3)?.rules).toEqual({ 4: 'Blocked' });
  });
  it('removes the draft on finish or cancel', () => {
    writeChildDraft(1, draft);
    removeChildDraft(1);
    expect(readChildDraft(1, 3)).toBeNull();
  });
});
