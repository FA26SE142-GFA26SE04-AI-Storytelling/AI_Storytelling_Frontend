import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStorySessions, readStorySession, removeStorySession, storySessionKey, studioTarget, writeStorySession } from '@/app/features/story-workflow/storyStudioSession';

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

describe('story studio session isolation', () => {
  it('isolates by account and child, without storing creative input', () => {
    writeStorySession(1, 7, { storyId: 10, requestId: 20 });
    expect(readStorySession(1, 7)).toEqual({ storyId: 10, requestId: 20 });
    expect(readStorySession(2, 7)).toBeNull();
    expect(readStorySession(1, 8)).toBeNull();
  });
  it('rejects corrupted snapshots and invalid IDs', () => {
    sessionStorage.setItem(storySessionKey(1, 7), '{broken');
    expect(readStorySession(1, 7)).toBeNull();
    sessionStorage.setItem(storySessionKey(1, 7), JSON.stringify({ storyId: -1, requestId: 2 }));
    expect(readStorySession(1, 7)).toBeNull();
  });
  it('clears workflow snapshots at logout without touching unrelated storage', () => {
    writeStorySession(1, 7, { storyId: 10, requestId: 20 });
    writeStorySession(2, 7, { storyId: 11, requestId: null });
    sessionStorage.setItem('other-preference', 'keep');
    clearStorySessions();
    expect(readStorySession(1, 7)).toBeNull();
    expect(readStorySession(2, 7)).toBeNull();
    expect(sessionStorage.getItem('other-preference')).toBe('keep');
  });
  it('chờ biết bé của truyện trước khi mở lại, không đoán bé đầu danh sách', () => {
    expect(studioTarget({ resumeStoryId: 902, chosenChildId: null, cachedStoryId: null, owner: null })).toEqual({ kind: 'loading' });
    expect(studioTarget({ resumeStoryId: 902, chosenChildId: null, cachedStoryId: null, owner: { storyId: 5, childId: 4 } })).toEqual({ kind: 'loading' });
  });
  it('mở lại truyện bằng bé thật của truyện, kể cả khi đang chọn bé khác', () => {
    expect(studioTarget({ resumeStoryId: 902, chosenChildId: null, cachedStoryId: null, owner: { storyId: 902, childId: 13 } }))
      .toEqual({ kind: 'resume', childId: 13 });
    expect(studioTarget({ resumeStoryId: 902, chosenChildId: 1, cachedStoryId: null, owner: { storyId: 902, childId: 13 } }))
      .toEqual({ kind: 'resume', childId: 13 });
    // Không xác định được bé (không có quyền / lỗi mạng): dùng bé đang chọn nếu có.
    expect(studioTarget({ resumeStoryId: 902, chosenChildId: 1, cachedStoryId: null, owner: { storyId: 902, childId: null } }))
      .toEqual({ kind: 'resume', childId: 1 });
  });
  it('phiên tạm của bé chứa truyện của bé khác thì bỏ và mở form mới', () => {
    expect(studioTarget({ resumeStoryId: null, chosenChildId: 1, cachedStoryId: 902, owner: null })).toEqual({ kind: 'loading' });
    expect(studioTarget({ resumeStoryId: null, chosenChildId: 1, cachedStoryId: 902, owner: { storyId: 902, childId: 13 } }))
      .toEqual({ kind: 'fresh', dropStale: true });
    expect(studioTarget({ resumeStoryId: null, chosenChildId: 13, cachedStoryId: 902, owner: { storyId: 902, childId: 13 } }))
      .toEqual({ kind: 'fresh', dropStale: false });
    expect(studioTarget({ resumeStoryId: null, chosenChildId: 1, cachedStoryId: null, owner: null })).toEqual({ kind: 'fresh', dropStale: false });
  });
  it('removes only the explicitly selected workflow', () => {
    writeStorySession(1, 7, { storyId: 10, requestId: 20 });
    writeStorySession(1, 8, { storyId: 11, requestId: null });
    removeStorySession(1, 7);
    expect(readStorySession(1, 7)).toBeNull();
    expect(readStorySession(1, 8)?.storyId).toBe(11);
  });
});
