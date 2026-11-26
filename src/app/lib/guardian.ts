import type { ContentCategory, ContentCategoryGroup, ReadingMode } from "@/app/types/childProfile";

/** Hằng số và quy tắc dùng chung cho Luồng 1 (khu quản lý của phụ huynh). */

export const CHILD_STATUS: Record<string, { label: string; tone: "ok" | "wait" | "draft" | "flag" }> = {
  Draft: { label: "Nháp", tone: "draft" },
  Active: { label: "Đang hoạt động", tone: "ok" },
  Suspended: { label: "Tạm dừng", tone: "flag" },
  Archived: { label: "Đã lưu trữ", tone: "draft" },
};
export const childStatus = (s: string) => CHILD_STATUS[s] ?? { label: s, tone: "draft" as const };

export const AGE_BANDS = [
  { id: "Age_6_8", label: "6–8 tuổi", hint: "Đang học đọc, nghe là chính" },
  { id: "Age_9_10", label: "9–10 tuổi", hint: "Đã tự đọc được" },
] as const;

/** Tuổi chọn được cho hồ sơ bé (backend ChildProfileService: 6–10, phải khớp nhóm tuổi). Không hỏi ngày sinh. */
export const CHILD_AGES = [6, 7, 8, 9, 10] as const;
/** Nhóm tuổi của một tuổi cụ thể: 6–8 hoặc 9–10. */
export const ageBandOfAge = (age: number): "Age_6_8" | "Age_9_10" => (age <= 8 ? "Age_6_8" : "Age_9_10");
/** Bé đang học lớp mấy: chỉ dùng để chọn sẵn mức đọc (lớp N → mức N), không lưu lên server. */
export const SCHOOL_GRADES = [1, 2, 3, 4, 5] as const;

/**
 * Thang mức đọc 1–5, mỗi mức tương đương một lớp (Luồng 2 mục 5.3b).
 * maxWords/typicalWords khớp ngưỡng backend khi AI viết truyện tiếng Việt (ContentReadabilityLimits):
 * trung bình tối đa 6 + 4 × mức từ/câu, AI nhắm khoảng 70% ngưỡng đó. Đổi công thức backend thì sửa theo.
 */
const READING_LEVEL_SAMPLES = [
  "Bé Na có một chú mèo nhỏ.",
  "Sáng nay, Na dắt mèo con ra vườn chơi.",
  "Vì trời mưa to nên Na ở nhà đọc truyện với mẹ.",
  "Đứng trước khu rừng phủ sương, Na thấy tim mình đập nhanh vì hồi hộp.",
  "Dù đội của Na thua, cả nhóm vẫn vui vì hiểu rằng sự kiên trì mới đáng quý.",
];
const TYPICAL_WORDS = [7, 9, 12, 15, 18];
const READING_LEVEL_TITLES = [
  "Mới tập đọc",
  "Đọc câu đơn",
  "Đọc trôi chảy",
  "Đọc hiểu sâu",
  "Đọc thành thạo",
] as const;
export const READING_LEVELS = [1, 2, 3, 4, 5].map((n) => ({
  level: n,
  label: `Mức ${n}`,
  grade: `Tương đương lớp ${n}`,
  title: READING_LEVEL_TITLES[n - 1],
  shortLabel: `Mức ${n} · Lớp ${n} (${READING_LEVEL_TITLES[n - 1]})`,
  optionLabel: `Mức ${n} · Lớp ${n} — ${READING_LEVEL_TITLES[n - 1]} (câu ~${TYPICAL_WORDS[n - 1]} từ, tối đa ${6 + 4 * n} từ/câu)`,
  maxWords: 6 + 4 * n,
  typicalWords: TYPICAL_WORDS[n - 1],
  sample: READING_LEVEL_SAMPLES[n - 1],
}));
export const readingLevelInfo = (level?: number | null) =>
  typeof level === "number" ? READING_LEVELS.find((l) => l.level === level) ?? null : null;
export const readingLevelBadgeText = (level?: number | null) => {
  const info = readingLevelInfo(level);
  return info ? `Mức đọc ${info.level} · Lớp ${info.level}` : level != null ? `Mức đọc ${level}` : "Chưa gắn";
};
export const defaultReadingLevel = (ageBand: string) => (ageBand === "Age_9_10" ? 3 : 1);

const isOlderAgeBand = (ageBand?: string) => ageBand === "Age_9_10" || ageBand === "9-10";
/** Mức đọc từ đây trở lên dùng độ dài của bé 9–10 tuổi (backend LearningBatchOptions.OlderReadingLevelThreshold). */
export const OLDER_READING_LEVEL = 4;
/** Bé 6–8 tuổi chọn mức 4–5: mức đọc vượt nhóm tuổi, cần nhắc phụ huynh. */
export const levelAboveAge = (ageBand: string | undefined, level: number) => !isOlderAgeBand(ageBand) && level >= OLDER_READING_LEVEL;
/**
 * Độ dài mặc định cả truyện (backend AI:LearningGeneration, chấp nhận ±10%): lấy mức lớn hơn giữa nhóm tuổi và mức đọc,
 * tức bé 9–10 tuổi hoặc mức đọc 4–5 thì khoảng 1500 từ, còn lại khoảng 900 từ.
 */
export const storyLengthFor = (ageBand?: string, level?: number) => {
  const target = isOlderAgeBand(ageBand) || (level ?? 0) >= OLDER_READING_LEVEL ? 1500 : 900;
  return { target, min: Math.ceil(target * 0.9), max: Math.floor(target * 1.1) };
};
/** Trần 110% của một độ dài, làm tròn lên. Phản chiếu backend StoryLengthRules.UpperBound; dùng số nguyên để tránh lệch số thực (900 * 1.1 = 990.0000000000001). */
export const storyLengthUpperBound = (target: number) => Math.ceil((target * 11) / 10);
/**
 * Trần lưu khi độ dài truyện đang theo mức đọc (chưa tự chỉnh). 1500 là mặc định lớn nhất (bé 9–10 tuổi hoặc mức đọc 4–5),
 * nên trần vẫn phủ được khi mức đọc hoặc nhóm tuổi tăng lên sau này và không bị coi là giới hạn cũ do phụ huynh đặt.
 */
export const LEVEL_MODE_STORY_CAP = storyLengthUpperBound(1500);
/** Độ dài nhỏ nhất phụ huynh được đặt (backend StoryLengthRules.MinimumTarget). */
export const STORY_LENGTH_MIN = 300;

/**
 * Thanh kéo "Độ dài truyện": phụ huynh chỉ được hạ, từ 300 đến mặc định theo tuổi và mức đọc (backend từ chối số lớn hơn).
 * Bước 1 để kéo tới đúng số muốn, kể cả số lẻ.
 */
export const storyLengthRange = (ageBand: string | undefined, level: number) =>
  ({ min: STORY_LENGTH_MIN, max: storyLengthFor(ageBand, level).target, step: 1 }) as const;

/**
 * Độ dài truyện hiển thị ở tab An toàn. Phản chiếu StoryLengthRules.ForGeneration ở backend:
 * số phụ huynh tự chỉnh nếu có (kẹp về mặc định vì chỉ được hạ; số cũ cao hơn không còn tác dụng khi tạo truyện);
 * chưa có thì theo mức đọc, trừ khi giới hạn cũ thấp hơn mặc định (phụ huynh đã đặt từ trước) thì coi giới hạn đó là số tự chỉnh.
 */
export const effectiveStoryLength = (
  ageBand: string | undefined,
  level: number,
  storyLengthTarget: number | null | undefined,
  maxStoryLength: number,
): { value: number; custom: boolean } => {
  const byLevel = storyLengthFor(ageBand, level).target;
  if (typeof storyLengthTarget === "number" && storyLengthTarget > 0) return { value: Math.min(storyLengthTarget, byLevel), custom: true };
  if (maxStoryLength > 0 && maxStoryLength < byLevel) return { value: maxStoryLength, custom: true };
  return { value: byLevel, custom: false };
};

/** Thanh kéo "Độ dài tối đa của truyện" (cài đặt an toàn MaxStoryLength), dùng chung cho form tạo bé và trang An toàn. */
export const MAX_STORY_LENGTH_RANGE = { min: 200, max: 5000, step: 100 } as const;
export const isMaxStoryLength = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= MAX_STORY_LENGTH_RANGE.min && n <= MAX_STORY_LENGTH_RANGE.max;

/** Đếm từ như backend: mỗi tiếng cách nhau bởi khoảng trắng là một từ. */
export const countWords = (text: string) => text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;

/** Bước 1.3 — chế độ đọc: 6–8 tuổi mặc định nghe là chính, 9–10 tuổi tự đọc. */
export const READING_MODES: { id: ReadingMode; label: string; hint: string }[] = [
  { id: "ListenFirst", label: "Nghe là chính", hint: "Tự đọc to cả truyện, chữ to, tranh lớn" },
  { id: "ReadFirst", label: "Tự đọc", hint: "Bé tự đọc, bấm loa khi cần nghe" },
];
export const defaultReadingMode = (ageBand: string): ReadingMode => (ageBand === "Age_9_10" ? "ReadFirst" : "ListenFirst");

/** Luồng 6 Mục 4 — trọng tâm kỹ năng, dùng làm "lĩnh vực ưu tiên". */

/** Mã avatar theo quy ước backend `avatar-<tên>`; hồ sơ mới nhận `avatar-default` (hiển thị là Ếch). */
export const AVATARS = [
  { id: "avatar-frog", emoji: "🐸", label: "Ếch" },
  { id: "avatar-cat", emoji: "🐱", label: "Mèo" },
  { id: "avatar-rabbit", emoji: "🐰", label: "Thỏ" },
  { id: "avatar-bear", emoji: "🐻", label: "Gấu" },
  { id: "avatar-fox", emoji: "🦊", label: "Cáo" },
  { id: "avatar-panda", emoji: "🐼", label: "Gấu trúc" },
  { id: "avatar-koala", emoji: "🐨", label: "Gấu túi" },
  { id: "avatar-tiger", emoji: "🐯", label: "Hổ" },
  { id: "avatar-lion", emoji: "🦁", label: "Sư tử" },
  { id: "avatar-owl", emoji: "🦉", label: "Cú" },
  { id: "avatar-eagle", emoji: "🦅", label: "Đại bàng" },
  { id: "avatar-turtle", emoji: "🐢", label: "Rùa" },
  { id: "avatar-dolphin", emoji: "🐬", label: "Cá heo" },
  { id: "avatar-whale", emoji: "🐳", label: "Cá voi" },
];
/** Nhận cả mã cũ không có tiền tố (`rabbit`); mã lạ hoặc `avatar-default` dùng avatar đầu tiên. */
export const avatarOf = (id?: string | null) => {
  const key = id && !id.startsWith("avatar-") ? `avatar-${id}` : id;
  return AVATARS.find((a) => a.id === key) ?? AVATARS[0];
};

/** Bước 1.4 — nội dung đồng ý phụ huynh phải đọc (a)–(d). Phiên bản điều khoản do backend quản lý. */
export const CONSENT_ITEMS = [
  "Nền tảng chỉ lưu biệt danh, nhóm tuổi và cấu hình học tập của bé; không thu thập họ tên đầy đủ, ngày sinh, trường học hay địa chỉ.",
  "Truyện của bé do AI sinh ra và được kiểm tra an toàn tự động trước khi tới bước duyệt của bạn.",
  "Truyện bị AI gắn cờ nghi vấn có thể được kiểm duyệt viên của nền tảng đọc để kiểm tra an toàn. Kiểm duyệt viên không thấy biệt danh của bé hay thông tin gia đình. Bạn không nên đặt tên nhân vật trùng tên thật của con.",
  "Hệ thống tự phát hiện số điện thoại, địa chỉ, tên trường và biệt danh của bé trong truyện để cảnh báo bạn.",
];

/**
 * Danh sách chặn mặc định khi tạo hồ sơ (Bước 1.4).
 * Backend gắn sẵn `defaultBlockedAgeBands` cho từng danh mục; danh mục mẫu của Luồng 5 chưa có
 * trường này thì nhận diện theo mã hoặc tên, nhóm 6–8 tuổi chặn thêm nội dung gây sợ hãi.
 */
const SENSITIVE = /violen|bao.?luc|bạo lực|hate|thu.?ghet|thù ghét|kỳ thị|adult|nguoi.?lon|người lớn|sex|tình dục|alcohol|rượu|drug|chất kích thích|personal|ca.?nhan|cá nhân|danger|nguy hiểm|relig|tôn giáo|politic|chính trị/i;
const HORROR = /horror|kinh dị|ma quỷ/i;
const MILD_FEAR = /scary|fear|sợ hãi|so.?hai/i;
export function presetBlocked(categories: ContentCategory[], ageBand: string): number[] {
  if (categories.some((c) => c.defaultBlockedAgeBands)) {
    return categories.filter((c) => c.defaultBlockedAgeBands?.includes(ageBand)).map((c) => c.id);
  }
  return categories.filter((c) => {
    const text = `${c.code} ${c.displayName}`;
    return SENSITIVE.test(text) || HORROR.test(text) || (ageBand === "Age_6_8" && MILD_FEAR.test(text));
  }).map((c) => c.id);
}

/** Nhóm danh mục nội dung (cột `group` backend trả về), theo thứ tự hiển thị. Nhãn trùng với màn quản lý danh mục của Moderator. */
export const CATEGORY_GROUPS: { id: ContentCategoryGroup; label: string }[] = [
  { id: "Genre", label: "Thể loại" },
  { id: "LifeValue", label: "Giá trị và kỹ năng sống" },
  { id: "Learning", label: "Học tập" },
  { id: "SafetyWarning", label: "Cảnh báo an toàn" },
];

export type CategoryGroupId = ContentCategoryGroup | "Other";

/** Chia danh mục theo nhóm, giữ thứ tự trong từng nhóm. Danh mục thiếu hoặc lạ nhóm vào "Khác" ở cuối; nhóm rỗng bị bỏ. */
export function groupCategories<T extends { group?: string }>(cats: T[]): { id: CategoryGroupId; label: string; items: T[] }[] {
  const known = new Set<string>(CATEGORY_GROUPS.map((g) => g.id));
  const sections: { id: CategoryGroupId; label: string; items: T[] }[] = [
    ...CATEGORY_GROUPS.map((g) => ({ ...g, items: cats.filter((c) => c.group === g.id) })),
    { id: "Other", label: "Khác", items: cats.filter((c) => !c.group || !known.has(c.group)) },
  ];
  return sections.filter((s) => s.items.length > 0);
}

/** Bước 1.1 — mật khẩu ≥ 8 ký tự, có ít nhất 1 chữ và 1 số. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
  if (!/[A-Za-zÀ-ỹ]/.test(pw) || !/\d/.test(pw)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
export const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
