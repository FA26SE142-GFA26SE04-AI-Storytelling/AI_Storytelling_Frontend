import type { ReadingMode, ReadingQuizItem } from "@/app/types/reading";

/** Quy tắc Luồng 3 — chấm câu đố, EXP, Cây tri thức, chuỗi ngày đọc, huy hiệu. */

/** Bước 3.2 — chế độ đọc mặc định suy ra từ nhóm tuổi. */
export const readingModeFor = (ageBand: string): ReadingMode => (ageBand === "Age_9_10" ? "read_first" : "listen_first");

/** Bỏ dấu tiếng Việt, chữ thường, gộp khoảng trắng. */
export function normalizeAnswer(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase().replace(/[.,!?;:"'“”]/g, "").replace(/\s+/g, " ").trim();
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Bước 3.3.1 — chấm tự động, không dùng AI. Tự luận ngắn: chấp nhận có dấu lẫn không dấu;
 * từ ≥ 4 ký tự cho phép sai 1 ký tự.
 */
export function isAnswerCorrect(item: Pick<ReadingQuizItem, "type" | "acceptedAnswers">, given: string): boolean {
  const g = normalizeAnswer(given);
  if (!g) return false;
  return item.acceptedAnswers.some((a) => {
    const n = normalizeAnswer(a);
    if (n === g) return true;
    return item.type === "short_answer" && n.length >= 4 && editDistanceAtMostOne(n, g);
  });
}

/** Bước 3.3.1 — EXP lần đọc đầu. */
export const EXP = { completeFirstRead: 10, quizFirstCorrect: 2, wordCollected: 1 } as const;

/** Bước 3.4 — Cây tri thức lớn theo các mốc cố định. */
export const TREE_STAGES = [
  { min: 0, label: "Hạt giống", emoji: "🌰" },
  { min: 20, label: "Mầm non", emoji: "🌱" },
  { min: 60, label: "Cây non", emoji: "🌿" },
  { min: 120, label: "Cây lớn", emoji: "🌳" },
  { min: 200, label: "Cây ra hoa", emoji: "🌸" },
];
export function treeStage(exp: number) {
  let index = 0;
  TREE_STAGES.forEach((s, i) => { if (exp >= s.min) index = i; });
  const next = TREE_STAGES[index + 1];
  const progress = next ? (exp - TREE_STAGES[index].min) / (next.min - TREE_STAGES[index].min) : 1;
  return { index, ...TREE_STAGES[index], next: next ?? null, progress: Math.max(0, Math.min(1, progress)) };
}

/** Ngày theo giờ Việt Nam (Asia/Ho_Chi_Minh), dạng YYYY-MM-DD. */
export const vnDate = (d = new Date()) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

/** Chuỗi ngày đọc: tăng 1 khi trong ngày có phiên hoàn thành; bỏ 1 ngày thì về lại từ đầu. */
export function nextStreak(last: string | null, streak: number, today: string): number {
  if (last === today) return streak;
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return last === yesterday ? streak + 1 : 1;
}

/** Bước 3.3.1 — danh mục huy hiệu cố định. */
export const BADGES: Record<string, { label: string; emoji: string; hint: string }> = {
  first_story: { label: "Truyện đầu tiên", emoji: "📖", hint: "Đọc xong truyện đầu tiên" },
  streak_7: { label: "7 ngày chăm chỉ", emoji: "🔥", hint: "Đọc truyện 7 ngày liên tiếp" },
  word_collector_50: { label: "Nhà sưu tầm từ", emoji: "📝", hint: "Lưu 50 từ mới vào sổ tay" },
  roadmap_finisher: { label: "Đọc hết lộ trình", emoji: "🗺️", hint: "Đọc hết truyện bố mẹ chọn" },
  story_explorer: { label: "Nhà thám hiểm", emoji: "🧭", hint: "Khám phá mọi kết thúc của một truyện" },
  little_detective: { label: "Thám tử nhí", emoji: "🔍", hint: "Đoán đúng diễn biến 10 lần" },
  wish_maker: { label: "Điều ước thành thật", emoji: "🌟", hint: "Điều ước đầu tiên thành truyện" },
};

/** Huy hiệu mới đạt được sau một phiên hoàn thành. */
export function earnedBadges(stats: { storiesCompleted: number; streakDays: number; wordsCollected: number; roadmapFinished: boolean; wishFulfilled: boolean }, owned: string[]): string[] {
  const rules: [string, boolean][] = [
    ["first_story", stats.storiesCompleted >= 1],
    ["streak_7", stats.streakDays >= 7],
    ["word_collector_50", stats.wordsCollected >= 50],
    ["roadmap_finisher", stats.roadmapFinished],
    ["wish_maker", stats.wishFulfilled],
  ];
  return rules.filter(([code, ok]) => ok && !owned.includes(code)).map(([code]) => code);
}

/** Mini-game sắp xếp: lấy tối đa 4 câu theo thứ tự xuất hiện trong truyện. */
export function sequencingItems(pages: string[], count = 4): string[] {
  const sentences = pages.flatMap((p) => p.match(/[^.!?…]+[.!?…]+/g) ?? []).map((s) => s.trim()).filter((s) => s.length > 12 && s.length < 140);
  if (sentences.length < 3) return [];
  const step = sentences.length / Math.min(count, sentences.length);
  return Array.from({ length: Math.min(count, sentences.length) }, (_, i) => sentences[Math.floor(i * step)]);
}

/** Xáo trộn (dùng cho mini-game và phiên đọc lại khi Hold Mode). */
export function shuffle<T>(list: T[], seed = Math.random()): T[] {
  const out = list.slice();
  let s = Math.floor(seed * 2 ** 31) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Tách văn bản thành các "chữ" (tiếng) để tô sáng và tra từ, giữ nguyên dấu câu, khoảng trắng. */
export function tokenize(text: string): { text: string; word: boolean }[] {
  return (text.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) ?? []).map((t) => ({ text: t, word: /[\p{L}\p{N}]/u.test(t) }));
}
