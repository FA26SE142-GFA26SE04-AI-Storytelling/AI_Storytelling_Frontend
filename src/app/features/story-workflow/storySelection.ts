/**
 * Vùng chọn trong bản thảo, tính theo vị trí ký tự của nội dung gốc.
 * API partial-edit yêu cầu đúng { start, endExclusive, text } khớp với content của version hiện tại.
 */
export interface StorySelection {
  start: number;
  endExclusive: number;
  text: string;
}

export interface StoryParagraph {
  start: number;
  text: string;
}

/** Các đoạn văn (theo dòng) kèm vị trí bắt đầu trong nội dung gốc. */
export function paragraphsWithOffsets(content: string): StoryParagraph[] {
  return [...content.matchAll(/[^\n]+/g)]
    .filter((m) => m[0].trim())
    .map((m) => ({ start: m.index ?? 0, text: m[0] }));
}

/** Cắt khoảng trắng hai đầu; null nếu vùng chọn rỗng hoặc vượt nội dung. */
export function normalizeSelection(content: string, a: number, b: number): StorySelection | null {
  let start = Math.max(0, Math.min(a, b));
  let end = Math.min(content.length, Math.max(a, b));
  while (start < end && /\s/.test(content[start])) start++;
  while (end > start && /\s/.test(content[end - 1])) end--;
  if (end <= start) return null;
  return { start, endExclusive: end, text: content.slice(start, end) };
}

/** Chọn cả một đoạn văn. */
export function paragraphSelection(content: string, paragraph: StoryParagraph): StorySelection | null {
  return normalizeSelection(content, paragraph.start, paragraph.start + paragraph.text.length);
}

/** Phần giao giữa một đoạn văn và vùng chọn, tính trong đoạn đó (để tô sáng). */
export function overlapInParagraph(paragraph: StoryParagraph, selection: StorySelection | null): [number, number] | null {
  if (!selection) return null;
  const from = Math.max(selection.start, paragraph.start) - paragraph.start;
  const to = Math.min(selection.endExclusive, paragraph.start + paragraph.text.length) - paragraph.start;
  return to > from ? [from, to] : null;
}

/** Đếm từ đơn giản theo khoảng trắng (tiếng Việt: mỗi tiếng là một từ). */
export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
