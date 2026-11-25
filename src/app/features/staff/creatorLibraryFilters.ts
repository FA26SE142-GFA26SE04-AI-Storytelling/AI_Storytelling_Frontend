import type { CreatorDraft } from "@/app/types/creator";

/** Nhãn hiển thị và hàm thuần lọc/sắp xếp cho trang "Thư viện" của Content Creator. */
export const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
export const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
export const SOURCE: Record<string, string> = { ai: "Do AI tạo", manual: "Thủ công" };

export const isAi = (s: CreatorDraft) => s.source?.toLowerCase() === "ai";
export const sourceOf = (s: CreatorDraft) => (isAi(s) ? "ai" : "manual");
export const topicOf = (s: CreatorDraft) => s.genre?.trim() || "Khác";
export const ageText = (band: string) => AGE[band] ?? band;
const statusKey = (s: CreatorDraft) => (s.status ?? "draft").toLowerCase().replace(/[^a-z]/g, "");

/** Kệ theo trạng thái; mỗi truyện chỉ nằm ở đúng một kệ. */
export const SHELVES: { id: string; title: string; sub: string; keys: string[] }[] = [
  { id: "draft", title: "Đang soạn", sub: "Bản nháp chưa gửi duyệt", keys: ["draft"] },
  { id: "review", title: "Đang duyệt & chuẩn bị", sub: "Chờ kiểm duyệt viên duyệt hoặc đang tạo tranh và giọng đọc",
    keys: ["inputaccepted", "generating", "outlinereview", "moderationreview", "contentreview", "approved", "mediaprocessing", "mediareview"] },
  { id: "ready", title: "Sẵn sàng", sub: "Đã hoàn tất nội dung và media", keys: ["ready", "published"] },
];
export const shelfOf = (s: CreatorDraft) => SHELVES.find((g) => g.keys.includes(statusKey(s)))?.id ?? "draft";
export const shelfTitle = (s: CreatorDraft) => SHELVES.find((g) => g.id === shelfOf(s))?.title ?? "";

const NEW_MS = 3 * 86_400_000;
export const isNewDraft = (s: CreatorDraft, now = Date.now()) => now - Date.parse(s.createdAt) < NEW_MS;

export type CreatorLibrarySort = "updated" | "created" | "title";
export const CREATOR_SORT_OPTIONS: { value: CreatorLibrarySort; label: string }[] = [
  { value: "updated", label: "Mới cập nhật" },
  { value: "created", label: "Mới tạo" },
  { value: "title", label: "Tên A–Z" },
];

export type CreatorLibraryFilterState = { query: string; age: string; genre: string; source: string; status: string; sort: CreatorLibrarySort };
export const EMPTY_FILTERS: CreatorLibraryFilterState = { query: "", age: "all", genre: "all", source: "all", status: "all", sort: "updated" };

/** Đang tìm hoặc lọc thì trang chỉ hiện một mục "Kết quả". */
export const isFiltering = (f: CreatorLibraryFilterState) =>
  f.query.trim() !== "" || [f.age, f.genre, f.source, f.status].some((v) => v !== "all");

const time = (iso: string | null | undefined) => Date.parse(iso ?? "") || 0;

export function sortCreatorStories(list: CreatorDraft[], sort: CreatorLibrarySort): CreatorDraft[] {
  const out = [...list];
  if (sort === "title") return out.sort((a, b) => (a.title || "").localeCompare(b.title || "", "vi", { numeric: true }));
  if (sort === "created") return out.sort((a, b) => time(b.createdAt) - time(a.createdAt));
  return out.sort((a, b) => time(b.updatedAt ?? b.createdAt) - time(a.updatedAt ?? a.createdAt));
}

export function filterCreatorStories(list: CreatorDraft[], f: CreatorLibraryFilterState): CreatorDraft[] {
  const needle = f.query.trim().toLocaleLowerCase("vi");
  return sortCreatorStories(list.filter((s) =>
    (f.age === "all" || s.ageBand === f.age) &&
    (f.genre === "all" || topicOf(s) === f.genre) &&
    (f.source === "all" || sourceOf(s) === f.source) &&
    (f.status === "all" || shelfOf(s) === f.status) &&
    (!needle || `${s.title ?? ""} ${topicOf(s)}`.toLocaleLowerCase("vi").includes(needle)),
  ), f.sort);
}

/** Các lựa chọn của một nhóm lọc kèm số truyện, xếp theo nhãn. */
export function facets(list: CreatorDraft[], keyOf: (s: CreatorDraft) => string, labelOf: (key: string) => string = (k) => k) {
  const counts = new Map<string, number>();
  for (const s of list) counts.set(keyOf(s), (counts.get(keyOf(s)) ?? 0) + 1);
  return [...counts].map(([key, count]) => ({ key, label: labelOf(key), count }))
    .sort((a, b) => a.label.localeCompare(b.label, "vi", { numeric: true }));
}

/** Chủ đề xếp theo số truyện giảm dần (bằng nhau thì theo tên), giống Thư viện phụ huynh. */
export const topicFacets = (list: CreatorDraft[]) => facets(list, topicOf).sort((a, b) => b.count - a.count);
