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
