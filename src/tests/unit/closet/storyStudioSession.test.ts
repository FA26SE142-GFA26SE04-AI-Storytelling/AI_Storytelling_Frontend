import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStorySessions, readStorySession, removeStorySession, storySessionKey, writeStorySession } from '../../../app/components/closet/hooks/storyStudioSession';

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
  it('removes only the explicitly selected workflow', () => {
    writeStorySession(1, 7, { storyId: 10, requestId: 20 });
    writeStorySession(1, 8, { storyId: 11, requestId: null });
    removeStorySession(1, 7);
    expect(readStorySession(1, 7)).toBeNull();
    expect(readStorySession(1, 8)?.storyId).toBe(11);
  });
});
