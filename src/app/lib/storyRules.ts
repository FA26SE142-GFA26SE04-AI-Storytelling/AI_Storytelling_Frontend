import type { VocabularyLevel } from "@/app/types/aiStory";

/** Quy tắc dùng chung cho Luồng 2 (sinh truyện, nhập truyện, duyệt). */

/** Luồng 2 mục 3.1 — mỗi thể loại gắn một khung truyện trong Prompt Catalog. */
export const GENRES = ["Cổ tích", "Phiêu lưu", "Động vật", "Khoa học vui", "Đời sống hằng ngày", "Ngụ ngôn"];

export const MORAL_LESSONS = ["Biết chia sẻ", "Dũng cảm", "Trung thực", "Kiên nhẫn", "Biết ơn", "Tôn trọng bạn bè", "Yêu thương gia đình", "Giữ gìn thiên nhiên", "Biết xin lỗi", "Tự lập"];
export const SAMPLE_CHARACTERS = ["Ếch Xanh", "Sóc Bông", "Thỏ Trắng", "Mèo Mướp", "Rùa Con", "Cô bé phi hành gia", "Chú rồng nhỏ", "Robot tí hon"];
export const SAMPLE_SETTINGS = ["Khu rừng", "Đáy biển", "Trường học", "Ngôi làng", "Vũ trụ", "Đầm sen"];

/** Luồng 2 mục 5.3b — độ dài truyện (tiếng) theo mức đọc. */
export const LEVEL_LENGTH: Record<number, [number, number]> = { 1: [200, 400], 2: [400, 700], 3: [700, 1100], 4: [1100, 1600], 5: [1600, 2400] };

export type LengthChoice = "short" | "medium" | "long";
export const LENGTHS: { id: LengthChoice; label: string }[] = [
  { id: "short", label: "Ngắn" },
  { id: "medium", label: "Vừa" },
  { id: "long", label: "Dài" },
];

/** Ngắn/vừa/dài = phần ba thấp/giữa/cao của khoảng độ dài; không vượt độ dài tối đa của bé. */
export function lengthTarget(choice: LengthChoice, readingLevel: number, maximum: number): number {
  const [min, max] = LEVEL_LENGTH[Math.min(5, Math.max(1, readingLevel))];
  const third = (max - min) / 3;
  const mid = { short: min + third / 2, medium: min + third * 1.5, long: min + third * 2.5 }[choice];
  return Math.max(1, Math.min(Math.round(mid / 10) * 10, maximum));
}

export function lengthChoiceOf(target: number, readingLevel: number): LengthChoice {
  const [min, max] = LEVEL_LENGTH[Math.min(5, Math.max(1, readingLevel))];
  const third = (max - min) / 3;
  return target < min + third ? "short" : target < min + third * 2 ? "medium" : "long";
}

/** Luồng 2 mục 3.1 — mức từ vựng. */
export type VocabChoice = "familiar" | "default" | "extended";
export const VOCAB_CHOICES: { id: VocabChoice; label: string; hint: string }[] = [
  { id: "familiar", label: "Quen thuộc", hint: "Không thêm từ mới" },
  { id: "default", label: "Theo trình độ", hint: "Số từ mới theo mức đọc" },
  { id: "extended", label: "Mở rộng", hint: "Thêm tối đa 2 từ mới" },
];
export function vocabularyLevelFor(choice: VocabChoice | undefined, fallback: VocabularyLevel, readingLevel: number): VocabularyLevel {
  if (!choice || choice === "default") return fallback;
  const n = Math.min(5, Math.max(1, readingLevel + (choice === "familiar" ? -1 : 1)));
  return `level_${n}` as VocabularyLevel;
}

/** Luồng 2 BR-2.20 — trường tự do tối đa 200 ký tự. */
export const FREE_TEXT_MAX = 200;

/** Luồng 2 mục 3.3c — một số nhân vật/thương hiệu có bản quyền phổ biến. */
const COPYRIGHTED = ["doraemon", "nobita", "pikachu", "pokemon", "elsa", "frozen", "mickey", "spider-man", "spiderman", "người nhện", "batman", "superman", "conan", "peppa", "hello kitty", "minion", "harry potter", "naruto", "shin", "doremon"];
export function copyrightHits(text: string): string[] {
  const t = text.toLowerCase();
  return COPYRIGHTED.filter((name) => t.includes(name));
}

/** Luồng 2 mục 3.3b — phát hiện thông tin có thể định danh bé/gia đình (bằng quy tắc, không dùng AI). */
export type PiiHit = { kind: string; text: string };
const PII_RULES: { kind: string; re: RegExp }[] = [
  { kind: "số điện thoại", re: /(?:\+?84|0)(?:[\s.-]?\d){9,10}\b/g },
  { kind: "email", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { kind: "đường dẫn mạng", re: /\b(?:https?:\/\/|www\.)\S+|(?:facebook|fb|zalo|tiktok)\.com\/\S+/gi },
  { kind: "địa chỉ", re: /\b(?:số\s*)?\d{1,4}[A-Za-z]?\s*(?:\/\d+\s*)?(?:đường|phố|ngõ|hẻm|kiệt)\s+[\p{L}\s]{2,30}/giu },
  { kind: "tên trường", re: /trường\s+(?:tiểu học|mầm non|thcs|trung học)\s+[\p{L}\s]{2,30}|\blớp\s+\d[A-Za-z]\d?\b/giu },
];
export function detectPii(text: string, nickname?: string): PiiHit[] {
  const hits: PiiHit[] = [];
  for (const { kind, re } of PII_RULES) for (const m of text.matchAll(re)) hits.push({ kind, text: m[0].trim() });
  const nick = nickname?.trim();
  if (nick && nick.length >= 2 && text.toLowerCase().includes(nick.toLowerCase())) hits.push({ kind: "biệt danh của bé", text: nick });
  return hits;
}

/** Luồng 2 mục 5.8 — danh sách mục đích chỉnh sửa cố định, đổi thành chỉ dẫn gửi cho AI. */
export type RevisionIntent = "simplify" | "shorten" | "lengthen" | "more_dialogue" | "less_scary" | "emphasize_lesson" | "age_fit" | "change_ending" | "custom";
export const REVISION_INTENTS: { id: RevisionIntent; label: string; instruction: string }[] = [
  { id: "simplify", label: "Đơn giản hơn", instruction: "Viết lại đơn giản hơn: câu ngắn hơn, ít từ khó hơn, giữ nguyên nhân vật, diễn biến và bài học." },
  { id: "shorten", label: "Ngắn hơn", instruction: "Rút ngắn khoảng 30%, giữ đủ các sự kiện chính, nhân vật và bài học." },
  { id: "lengthen", label: "Dài hơn", instruction: "Thêm chi tiết miêu tả cho sinh động hơn, không thêm sự kiện mới, giữ bài học." },
  { id: "more_dialogue", label: "Thêm hội thoại", instruction: "Chuyển một phần lời kể thành lời thoại giữa các nhân vật, giữ nguyên diễn biến." },
  { id: "less_scary", label: "Bớt đáng sợ", instruction: "Giảm căng thẳng, xung đột và yếu tố gây sợ cho trẻ nhỏ, giữ nguyên diễn biến chính và bài học." },
  { id: "emphasize_lesson", label: "Nhấn mạnh bài học", instruction: "Làm rõ bài học ở cuối đoạn một cách nhẹ nhàng, tự nhiên, không giảng giải dài." },
  { id: "age_fit", label: "Phù hợp lứa tuổi hơn", instruction: "Viết lại cho hợp với lứa tuổi và mức đọc của bé: bỏ chi tiết vượt tuổi, chỉnh từ ngữ và độ dài câu." },
  { id: "change_ending", label: "Đổi kết thúc", instruction: "Viết lại phần kết theo hướng khác nhưng vẫn tích cực và giữ bài học." },
  { id: "custom", label: "Khác", instruction: "" },
];
export function revisionInstruction(intent: RevisionIntent, note: string): string {
  const base = REVISION_INTENTS.find((i) => i.id === intent)?.instruction ?? "";
  const extra = note.trim().slice(0, FREE_TEXT_MAX);
  return [base, extra && `Ghi chú của phụ huynh: ${extra}`].filter(Boolean).join(" ");
}

/** Luồng 2 mục 6.6 — lý do lưu trữ quyết định có ngắt phiên đọc đang chạy hay không. */
export const ARCHIVE_REASONS = [
  { id: "supervisor_preference", label: "Không muốn dùng truyện này nữa", hint: "Ẩn khỏi thư viện của bé. Bé đang đọc dở vẫn đọc tiếp được." },
  { id: "safety_concern", label: "Nội dung chưa an toàn", hint: "Bé đang đọc sẽ được đưa ra ngay. Không khôi phục được." },
] as const;
export type ArchiveReason = (typeof ARCHIVE_REASONS)[number]["id"];

/** Luồng 2 mục 6.3 — loại câu hỏi đọc hiểu; nhóm 6–8 tuổi không có tự luận ngắn. */
export const QUIZ_TYPES = [
  { id: "multiple_choice", label: "Trắc nghiệm" },
  { id: "true_false", label: "Đúng / Sai" },
  { id: "short_answer", label: "Tự luận ngắn" },
] as const;
export const quizTypesFor = (ageBand: string) => QUIZ_TYPES.filter((t) => ageBand !== "Age_6_8" || t.id !== "short_answer");
