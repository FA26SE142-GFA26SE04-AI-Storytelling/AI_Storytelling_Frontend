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

/** Khu nhân viên: trang đang mở (và truyện đang xem) để tải lại trang hay quay lại từ tab khác không bị đưa về trang đầu. */
export interface StaffWorkspaceSnapshot { pageId: string; target: number | null }
const staffKey = (userId: number) => `${STORY_SESSION_PREFIX}staff:${userId}`;
export function readStaffWorkspace(userId: number): StaffWorkspaceSnapshot | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(staffKey(userId)) ?? 'null');
    return value && typeof value.pageId === 'string' && (value.target === null || (Number.isSafeInteger(value.target) && value.target > 0)) ? value : null;
  } catch { return null; }
}
export function writeStaffWorkspace(userId: number, snapshot: StaffWorkspaceSnapshot) {
  try { sessionStorage.setItem(staffKey(userId), JSON.stringify(snapshot)); } catch { /* Optional browser storage. */ }
}

/** Truyện AI Content Creator đang soạn ở trang "Dùng AI"; null là xóa (bắt đầu truyện mới). */
const creatorAiKey = (userId: number) => `${STORY_SESSION_PREFIX}creator-ai:${userId}`;
export function readCreatorAiStory(userId: number): number | null {
  try {
    const value = Number(sessionStorage.getItem(creatorAiKey(userId)));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  } catch { return null; }
}
export function writeCreatorAiStory(userId: number, storyId: number | null) {
  try {
    if (storyId === null) sessionStorage.removeItem(creatorAiKey(userId));
    else sessionStorage.setItem(creatorAiKey(userId), String(storyId));
  } catch { /* Optional browser storage. */ }
}
