export const STORY_SESSION_PREFIX = 'ai-story-studio:v1:';
export interface StoryStudioSnapshot { storyId: number; requestId: number | null }
export function storySessionKey(userId: number, childId: number): string { return `${STORY_SESSION_PREFIX}${userId}:${childId}`; }
export function readStorySession(userId: number, childId: number): StoryStudioSnapshot | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storySessionKey(userId, childId)) ?? 'null');
    return value && Number.isSafeInteger(value.storyId) && value.storyId > 0 &&
      (value.requestId === null || (Number.isSafeInteger(value.requestId) && value.requestId > 0)) ? value : null;
  } catch { return null; }
}
export function writeStorySession(userId: number, childId: number, snapshot: StoryStudioSnapshot) {
  try { sessionStorage.setItem(storySessionKey(userId, childId), JSON.stringify(snapshot)); } catch { /* Storage can be disabled; API remains authoritative. */ }
}
export function clearStorySessions() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORY_SESSION_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch { /* No persistent workflow data is required to log out. */ }
}
export function removeStorySession(userId: number, childId: number) {
  try { sessionStorage.removeItem(storySessionKey(userId, childId)); } catch { /* Optional browser storage. */ }
}
