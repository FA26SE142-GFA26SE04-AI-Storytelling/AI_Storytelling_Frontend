import type * as B from "@/app/types/backendContracts";
import { ageLabel, statusKey, type StoryCard } from "@/app/lib/storyView";

/** Nhóm trạng thái hiển thị cho phụ huynh (Luồng 2 mục 6.9). */
export const STATUS_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: "draft", label: "Nháp", keys: ["draft"] },
  { id: "generating", label: "Đang sinh", keys: ["input_accepted", "generating"] },
  { id: "outline", label: "Chờ bạn duyệt dàn ý", keys: ["outline_review"] },
  { id: "moderation", label: "Đang kiểm duyệt an toàn", keys: ["moderation_review"] },
  { id: "review", label: "Chờ bạn duyệt", keys: ["content_review"] },
  { id: "media", label: "Đang chuẩn bị media", keys: ["approved", "media_processing", "media_review"] },
  { id: "ready", label: "Sẵn sàng", keys: ["ready", "published"] },
  { id: "blocked", label: "Bị chặn", keys: ["blocked"] },
  { id: "rejected", label: "Bị từ chối", keys: ["rejected"] },
];

/** Thư viện chỉ hiện truyện đã được duyệt: nháp, chờ duyệt, bị chặn, bị từ chối và lưu trữ được ẩn. */
export const SHOWN_GROUPS = ["media", "ready"] as const;

export type StorySourceKey = "creator" | "family" | "ai" | "manual";

export const SOURCE_LABEL: Record<StorySourceKey, string> = {
  creator: "Của creator",
  ai: "Do AI tạo",
  manual: "Nhập sẵn",
  family: "Tự soạn gia đình",
};

export type LibrarySort = "recent" | "views" | "favorites";

export const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: "recent", label: "Mới nhất" },
  { value: "views", label: "Đọc nhiều nhất" },
  { value: "favorites", label: "Được yêu thích" },
];

export const NEW_STORY_WINDOW_MS = 3 * 86_400_000;

export function statusOf(story: StoryCard): string {
  return STATUS_GROUPS.find((group) => group.keys.includes(statusKey(story.raw)))?.id ?? "draft";
}

export function topicOf(story: StoryCard): string {
  return story.topic.trim() || "Khác";
}

export function sourceOf(story: StoryCard): StorySourceKey {
  if (story.creator) return "creator";
  if (story.family) return "family";
  if (story.fromAi) return "ai";
  return "manual";
}

export function isNewStory(story: StoryCard, now = Date.now()): boolean {
  const created = Date.parse(story.createdAt);
  return Number.isFinite(created) && now - created >= 0 && now - created < NEW_STORY_WINDOW_MS;
}

export function normalizeAgeKey(band: string): string {
  const trimmed = band.trim();
  if (!trimmed) return "";
  const formatted = /\btuổi$/i.test(trimmed) ? trimmed : ageLabel(trimmed);
  return formatted.replace(/[–—]/g, "-").trim().toLowerCase();
}

/** Nhãn hiển thị độ tuổi thống nhất dấu gạch nối dài (6–8 tuổi, 9–10 tuổi) dù backend trả "6-8" hay "Age_6_8". */
export function canonicalAgeLabel(band: string): string {
  const trimmed = band.trim();
  if (!trimmed) return "";
  const formatted = /\btuổi$/i.test(trimmed) ? trimmed : ageLabel(trimmed);
  return formatted.replace(/-/g, "–").trim();
}

export type AgeFilterOption = { key: string; label: string; count: number };

/** Gom các định dạng nhóm tuổi tương đương ("6-8", "Age_6_8", "6–8") thành một nhóm lọc duy nhất kèm tổng số lượng. */
export function collectAgeOptions(items: { ageBand?: string | null }[]): AgeFilterOption[] {
  const map = new Map<string, AgeFilterOption>();
  for (const item of items) {
    const raw = item.ageBand?.trim();
    if (!raw) continue;
    const key = normalizeAgeKey(raw);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { key, label: canonicalAgeLabel(raw), count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key, "vi", { numeric: true }));
}

/** Tên tác giả an toàn: truyện cộng đồng thiếu tên tác giả không gán nhầm thành "Bạn". */
export function displayAuthorOf(story: StoryCard): string {
  const rawName = story.raw.authorName?.trim();
  if (rawName) return rawName;
  if (story.creator) return "Tác giả cộng đồng";
  return story.by?.trim() || "Bạn";
}

const READING_UNITS_PER_MINUTE = 120;

export function estimatedReadingMinutes(story: StoryCard): number | null {
  if (story.words <= 0) return null;
  return Math.max(1, Math.round(story.words / READING_UNITS_PER_MINUTE));
}

export const LIBRARY_DURATION_OPTIONS = [
  { key: "under-5", label: "Dưới 5 phút" },
  { key: "5-to-10", label: "5 – dưới 10 phút" },
  { key: "10-to-15", label: "10 – 15 phút" },
  { key: "over-15", label: "Trên 15 phút" },
] as const;

function durationKey(story: StoryCard) {
  if (story.words <= 0) return null;
  const minutes = story.words / READING_UNITS_PER_MINUTE;
  if (minutes < 5) return "under-5";
  if (minutes < 10) return "5-to-10";
  if (minutes <= 15) return "10-to-15";
  return "over-15";
}

export function collectDurationOptions(stories: StoryCard[]) {
  const counts = new Map<string, number>();
  for (const story of stories) {
    const key = durationKey(story);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return LIBRARY_DURATION_OPTIONS.map(({ key, label }) => ({ key, label, count: counts.get(key) ?? 0 }));
}

type LibraryAuthor = { key: string; label: string; count: number };

function communityAuthorKey(story: StoryCard) {
  const id = story.raw.authorUserId;
  return story.creator && story.raw.isPublished && id && id > 0 ? String(id) : null;
}

export function collectLibraryAuthors(stories: StoryCard[]): LibraryAuthor[] {
  const authors = new Map<string, LibraryAuthor>();
  for (const story of stories) {
    const key = communityAuthorKey(story);
    if (!key) continue;
    const author = authors.get(key) ?? { key, label: "", count: 0 };
    author.label ||= story.raw.authorName?.trim() ?? "";
    author.count += 1;
    authors.set(key, author);
  }
  return [...authors.values()].filter(({ label }) => label)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "vi"));
}

/** Chỉ gắn huy hiệu thứ hạng (#1, #2…) khi truyện thực sự có lượt đọc / lượt yêu thích > 0 ở tiêu chí đang sắp xếp. */
export function rankForStory(story: StoryCard, index: number, sort: LibrarySort): number | undefined {
  if (sort === "views") return (story.viewCount ?? 0) > 0 ? index + 1 : undefined;
  if (sort === "favorites") return (story.favoriteCount ?? 0) > 0 ? index + 1 : undefined;
  return undefined;
}

export type LibraryFilterState = {
  query: string;
  status: string;
  genre: string;
  age: string;
  source: string;
  duration: string;
  author: string;
  sort: LibrarySort;
};

export function countActiveFilters(filters: Pick<LibraryFilterState, "status" | "genre" | "age" | "source" | "duration" | "author">): number {
  return countPopoverFilters(filters) + Number(filters.genre !== "all");
}

export function countPopoverFilters(filters: Pick<LibraryFilterState, "status" | "age" | "source" | "duration" | "author">): number {
  return [filters.status, filters.age, filters.source, filters.duration, filters.author].filter((value) => value !== "all").length;
}

export function isFocusedCatalog(filters: LibraryFilterState): boolean {
  return filters.query.trim() !== "" || countActiveFilters(filters) > 0 || filters.sort !== "recent";
}

/** Sắp xếp truyện mới nhất lên trước (thứ tự mặc định của mọi kệ). */
export function sortByNewest(stories: StoryCard[]): StoryCard[] {
  return [...stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Lọc và sắp xếp danh sách truyện theo từ khóa, trạng thái, thể loại, độ tuổi, nguồn và tiêu chí sắp xếp. */
export function filterAndSortStories(sortedByNewest: StoryCard[], filters: LibraryFilterState): StoryCard[] {
  const needle = filters.query.trim().toLowerCase();
  const targetAge = filters.age === "all" ? null : normalizeAgeKey(filters.age);
  const filtered = sortedByNewest.filter((story) =>
    (filters.status === "all" || statusOf(story) === filters.status) &&
    (filters.genre === "all" || topicOf(story) === filters.genre) &&
    (targetAge === null || normalizeAgeKey(story.ageBand) === targetAge) &&
    (filters.source === "all" || sourceOf(story) === filters.source) &&
    (filters.duration === "all" || durationKey(story) === filters.duration) &&
    (filters.author === "all" || communityAuthorKey(story) === filters.author) &&
    (!needle || `${story.title} ${topicOf(story)} ${story.raw.authorName?.trim() ?? ""}`.toLowerCase().includes(needle)),
  );
  if (filters.sort === "views") {
    return [...filtered].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  }
  if (filters.sort === "favorites") {
    return [...filtered].sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0));
  }
  return filtered;
}

/** Đề xuất truyện sẵn sàng phù hợp nhóm tuổi của bé đang chọn (hoặc các bé trong gia đình). */
export function recommendedStories(sortedByNewest: StoryCard[], childAgeBands: string[], limit = 6): StoryCard[] {
  const targetAges = new Set(childAgeBands.filter(Boolean).map(normalizeAgeKey));
  return sortedByNewest
    .filter((story) => statusOf(story) === "ready" && (!targetAges.size || targetAges.has(normalizeAgeKey(story.ageBand))))
    .slice(0, limit);
}

/**
 * Chỉ hiện kệ "Đề xuất cho bé" khi nó thực sự giúp thu gọn/cá nhân hóa danh sách
 * (tránh lặp nguyên xi toàn bộ 1–2 truyện trong thư viện nhỏ), trừ khi phụ huynh đang chọn truyện cho một bé cụ thể.
 */
export function shouldShowRecommended(allStories: StoryCard[], recommended: StoryCard[], hasPickKid: boolean): boolean {
  if (recommended.length === 0) return false;
  if (hasPickKid) return true;
  return allStories.length > recommended.length;
}

/** Lọc danh sách lộ trình mẫu theo từ khóa và nhóm tuổi. */
export function filterRoadmaps(
  templates: B.RoadmapLibraryItemDto[] | null,
  query: string,
  ageBand = "all",
): B.RoadmapLibraryItemDto[] {
  const needle = query.trim().toLowerCase();
  const targetAge = ageBand === "all" ? null : normalizeAgeKey(ageBand);
  return (templates ?? []).filter((item) => {
    const matchesAge = targetAge === null || normalizeAgeKey(item.ageBand) === targetAge;
    if (!matchesAge) return false;
    if (!needle) return true;
    const hay = `${item.name} ${item.description ?? ""} ${item.mainCategory?.displayName ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
}
