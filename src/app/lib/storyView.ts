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
};

/** Ảnh bìa mẫu dùng chung cho mọi truyện chưa có ảnh bìa (public/default-cover.svg). */
export const DEFAULT_COVER = 'center / cover no-repeat url("/default-cover.svg")';

/** Giá trị CSS `background` của bìa truyện: ảnh bìa thật nếu có, không thì (hoặc khi ảnh lỗi) dùng ảnh mẫu chung. */
export const coverFor = (url?: string | null) => (url ? `center / cover no-repeat url("${url}"), ${DEFAULT_COVER}` : DEFAULT_COVER);

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
export function familyToCard(d: { storyId: number; authorUserId: number; title: string; description: string; language: string; ageBand: string; genre: string; createdAt: string; updatedAt: string | null; source: string; status: string }): StoryCard {
  const card = toCard({ id: d.storyId, title: d.title, description: d.description, genre: d.genre, ageBand: d.ageBand, language: d.language, source: d.source || "Manual", status: d.status, isPublished: false, authorUserId: d.authorUserId, authorName: null, createdAt: d.createdAt, updatedAt: d.updatedAt });
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
