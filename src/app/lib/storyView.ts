import type { StoryDto } from "@/app/types/story";
import { normalizeStoryStatus } from "@/app/features/story-workflow/storyGenerationFlow";

export type StoryTone = "ok" | "wait" | "draft" | "flag";

export type StoryCard = {
  id: number;
  title: string;
  ageBand: string;
  topic: string;
  fromAi: boolean;
  words: number;
  tone: StoryTone;
  statusLabel: string;
  by: string;
  /** Giá trị CSS background của bìa truyện (xem coverFor). */
  cover: string;
  createdAt: string;
  raw: StoryDto;
  /** Truyện tự soạn (trang "Thủ công"): chỉ mở và sửa qua API /parent/stories. */
  family?: boolean;
  /** Truyện của Creator đã duyệt, lấy từ GET /Story/community. */
  creator?: boolean;
};

/** Ảnh bìa mẫu dùng chung cho mọi truyện chưa có ảnh bìa (public/default-cover.svg). */
export const DEFAULT_COVER = 'center / cover no-repeat url("/default-cover.svg")';

/** Tỉ lệ khung bìa truyện (rộng/cao): thẻ truyện và khung chi tiết đều dùng 3:4 (dọc). */
export const COVER_RATIO = 3 / 4;

/**
 * Vùng ảnh được giữ làm bìa, tính theo tỉ lệ của cả tấm ảnh (0–1): góc trái-trên (x, y) và kích thước (w, h).
 * Backend chỉ lưu một chuỗi đường dẫn nên vùng cắt được ghi ngay sau dấu # của đường dẫn (phần sau # không gửi lên máy chủ ảnh):
 * `https://…/anh.jpg#crop=0.1,0.05,0.6,0.8`.
 */
export type CoverCrop = { x: number; y: number; w: number; h: number };
const CROP_TAIL = /#crop=(-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+)$/;

export function splitCover(value?: string | null): { src: string; crop: CoverCrop | null } {
  const v = (value ?? "").trim();
  const m = CROP_TAIL.exec(v);
  if (!m) return { src: v, crop: null };
  const [x, y, w, h] = m.slice(1).map(Number);
  const ok = [x, y, w, h].every(Number.isFinite) && w > 0 && h > 0 && w <= 1 && h <= 1;
  return { src: v.slice(0, m.index), crop: ok ? { x: Math.min(Math.max(x, 0), 1 - w), y: Math.min(Math.max(y, 0), 1 - h), w, h } : null };
}

export function joinCover(src: string, crop: CoverCrop | null): string {
  if (!src || !crop) return src;
  const f = (n: number) => String(Math.round(n * 10000) / 10000);
  return `${src}#crop=${f(crop.x)},${f(crop.y)},${f(crop.w)},${f(crop.h)}`;
}

/** Giá trị CSS `background` của bìa truyện: ảnh bìa thật (có vùng cắt thì phóng đúng vùng đó) nếu có, không thì (hoặc khi ảnh lỗi) dùng ảnh mẫu chung. */
export const coverFor = (url?: string | null) => {
  const { src, crop } = splitCover(url);
  if (!src) return DEFAULT_COVER;
  const pct = (n: number) => `${Math.round(Math.min(Math.max(n, 0), 1) * 10000) / 100}%`;
  const layout = crop
    ? `${crop.w >= 1 ? "0%" : pct(crop.x / (1 - crop.w))} ${crop.h >= 1 ? "0%" : pct(crop.y / (1 - crop.h))} / ${Math.round(10000 / crop.w) / 100}% ${Math.round(10000 / crop.h) / 100}% no-repeat`
    : "center / cover no-repeat";
  return `${layout} url("${src}"), ${DEFAULT_COVER}`;
};

const STATUS: Record<string, [StoryTone, string]> = {
  published: ["ok", "Đã xuất bản"],
  ready: ["ok", "Sẵn sàng"],
  approved: ["ok", "Đã duyệt"],
  media_processing: ["wait", "Đang tạo minh hoạ"],
  media_review: ["wait", "Chờ xác nhận tranh và giọng đọc"],
  content_review: ["wait", "Chờ bạn duyệt"],
  outline_review: ["wait", "Chờ bạn duyệt dàn ý"],
  input_accepted: ["wait", "Đang xử lý"],
  generating: ["wait", "Đang viết truyện"],
  // Phụ huynh chỉ thấy "đang kiểm duyệt", không thấy điểm rủi ro hay lý do (Luồng 2 mục 3.4).
  moderation_review: ["wait", "Đang kiểm duyệt an toàn"],
  blocked: ["flag", "Bị chặn"],
  rejected: ["draft", "Bị từ chối"],
  archived: ["draft", "Lưu trữ"],
  draft: ["draft", "Bản nháp"],
};

export function statusKey(story: Pick<StoryDto, "status" | "isPublished">): string {
  return story.isPublished ? "published" : normalizeStoryStatus(story.status || "draft");
}

/** Màu và nhãn tiếng Việt của một trạng thái truyện (dùng cho .pill). */
export function statusBadge(status: string): [StoryTone, string] {
  return STATUS[normalizeStoryStatus(status || "draft")] ?? ["draft", status || "Bản nháp"];
}

export function toCard(s: StoryDto): StoryCard {
  const [tone, statusLabel] = STATUS[statusKey(s)] ?? ["draft", s.status || "Bản nháp"];
  const text = s.content ?? "";
  return {
    id: s.id,
    title: s.title,
    ageBand: s.ageBand,
    topic: s.genre || "Khác",
    fromAi: /ai/i.test(s.source ?? ""),
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    tone,
    statusLabel,
    by: s.authorName || "Bạn",
    cover: coverFor(s.coverImageUrl),
    createdAt: s.createdAt,
    raw: s,
  };
}

/** Bản nháp tự soạn (GET /parent/stories) đổi sang thẻ truyện để hiện chung trong Thư viện. */
export function familyToCard(d: { storyId: number; authorUserId: number; title: string; description: string; language: string; ageBand: string; genre: string; createdAt: string; updatedAt: string | null; source: string; status: string; coverImageUrl?: string | null }): StoryCard {
  const card = toCard({ id: d.storyId, title: d.title, description: d.description, genre: d.genre, coverImageUrl: d.coverImageUrl, ageBand: d.ageBand, language: d.language, source: d.source || "Manual", status: d.status, isPublished: false, authorUserId: d.authorUserId, authorName: null, createdAt: d.createdAt, updatedAt: d.updatedAt });
  return { ...card, family: true, fromAi: false };
}

/** Tách nội dung truyện thành các cảnh: theo đoạn, nếu chỉ có một đoạn thì gom mỗi 3 câu. */
export function splitScenes(content: string): string[] {
  const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  const sentences = (paragraphs[0] ?? "").match(/[^.!?…]+[.!?…]+["”']?\s*|[^.!?…]+$/g) ?? [];
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) out.push(sentences.slice(i, i + 3).join("").trim());
  return out.filter(Boolean);
}

export const AGE_LABEL: Record<string, string> = { Age_6_8: "6–8 tuổi", Age_9_10: "9–10 tuổi" };
export const ageLabel = (band: string) => AGE_LABEL[band] ?? band.replace(/^Age_/, "").replace("_", "–") + " tuổi";
