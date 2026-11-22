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
  return ageLabel(band).replace(/[–—]/g, "-").trim().toLowerCase();
}

export type LibraryFilterState = {
  query: string;
  status: string;
  genre: string;
  age: string;
  source: string;
  sort: LibrarySort;
};

export function countActiveFilters(filters: Pick<LibraryFilterState, "status" | "genre" | "age" | "source">): number {
  return [filters.status, filters.genre, filters.age, filters.source].filter((value) => value !== "all").length;
}

export function countPopoverFilters(filters: Pick<LibraryFilterState, "status" | "age" | "source">): number {
  return [filters.status, filters.age, filters.source].filter((value) => value !== "all").length;
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
  const filtered = sortedByNewest.filter((story) =>
    (filters.status === "all" || statusOf(story) === filters.status) &&
    (filters.genre === "all" || topicOf(story) === filters.genre) &&
    (filters.age === "all" || story.ageBand === filters.age) &&
    (filters.source === "all" || sourceOf(story) === filters.source) &&
    (!needle || `${story.title} ${topicOf(story)}`.toLowerCase().includes(needle)),
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
  return (templates ?? []).filter((item) => {
    const matchesAge = ageBand === "all" || item.ageBand === ageBand;
    if (!matchesAge) return false;
    if (!needle) return true;
    const hay = `${item.name} ${item.description ?? ""} ${item.mainCategory?.displayName ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
}
