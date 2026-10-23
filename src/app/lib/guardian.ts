import type { ContentCategory, ReadingMode } from "@/app/types/childProfile";
import type { Permission } from "@/app/types/supervision";

/** Hằng số và quy tắc dùng chung cho Luồng 1 (khu quản lý của phụ huynh). */

export const CHILD_STATUS: Record<string, { label: string; tone: "ok" | "wait" | "draft" | "flag" }> = {
  Draft: { label: "Nháp", tone: "draft" },
  Active: { label: "Đang hoạt động", tone: "ok" },
  Suspended: { label: "Tạm dừng", tone: "flag" },
  Archived: { label: "Đã lưu trữ", tone: "draft" },
};
export const childStatus = (s: string) => CHILD_STATUS[s] ?? { label: s, tone: "draft" as const };

/** Luồng 1 Mục 8 — ý nghĩa từng quyền. */
export const PERMISSIONS: { id: Permission; label: string; hint: string }[] = [
  { id: "GenerateStory", label: "Tạo truyện AI", hint: "Tạo truyện AI theo hồ sơ và chính sách của bé" },
  { id: "ViewProgress", label: "Xem tiến độ đọc", hint: "Số phiên, thời gian đọc, chuỗi ngày đọc" },
  { id: "ViewResults", label: "Xem kết quả", hint: "Điểm câu đố, kết quả đọc hiểu" },
  { id: "ReceiveReport", label: "Nhận báo cáo định kỳ", hint: "Báo cáo tuần về việc đọc của bé" },
  { id: "ApproveStory", label: "Duyệt truyện", hint: "Duyệt truyện, xử lý điều ước, nộp thư viện cộng đồng" },
  { id: "AssignActivity", label: "Quản lý lộ trình của con", hint: "Thêm, gỡ, sắp xếp truyện; mở khóa Hold Mode" },
  { id: "ApproveReadingLevel", label: "Sửa mức đọc", hint: "Sửa mức đọc, quyết định đề xuất điều chỉnh" },
  { id: "ManageSafetySettings", label: "Sửa cài đặt an toàn", hint: "Cài đặt an toàn và mã đăng nhập của bé" },
];
/** Bước 1.7 — preset khi Additional Supervisor nhận lời mời. */
export const DEFAULT_PRESET: Permission[] = ["ViewProgress", "ViewResults", "ReceiveReport", "ApproveStory"];

export const AGE_BANDS = [
  { id: "Age_6_8", label: "6–8 tuổi", hint: "Đang học đọc, nghe là chính" },
  { id: "Age_9_10", label: "9–10 tuổi", hint: "Đã tự đọc được" },
] as const;

/** Thang mức đọc 1–5, mỗi mức tương đương một lớp (Luồng 2 mục 5.3b). */
export const READING_LEVELS = [1, 2, 3, 4, 5].map((n) => ({ level: n, label: `Mức ${n}`, grade: `Tương đương lớp ${n}` }));
export const defaultReadingLevel = (ageBand: string) => (ageBand === "Age_9_10" ? 3 : 1);

/** Bước 1.3 — chế độ đọc: 6–8 tuổi mặc định nghe là chính, 9–10 tuổi tự đọc. */
export const READING_MODES: { id: ReadingMode; label: string; hint: string }[] = [
  { id: "ListenFirst", label: "Nghe là chính", hint: "Tự đọc to cả truyện, chữ to, tranh lớn" },
  { id: "ReadFirst", label: "Tự đọc", hint: "Bé tự đọc, bấm loa khi cần nghe" },
];
export const defaultReadingMode = (ageBand: string): ReadingMode => (ageBand === "Age_9_10" ? "ReadFirst" : "ListenFirst");

/** Luồng 6 Mục 4 — trọng tâm kỹ năng, dùng làm "lĩnh vực ưu tiên". */
export const FOCUS_AREAS = ["Đọc hiểu", "Phát triển từ vựng", "Phát âm", "Sắp xếp trình tự", "Nguyên nhân – kết quả", "Suy luận"];
export const TOPIC_SUGGESTIONS = ["động vật", "thiên nhiên", "vũ trụ", "khoa học", "cổ tích", "gia đình", "tình bạn", "phiêu lưu", "robot", "biển cả"];

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

/** Bước 1.1 — mật khẩu ≥ 8 ký tự, có ít nhất 1 chữ và 1 số. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
  if (!/[A-Za-zÀ-ỹ]/.test(pw) || !/\d/.test(pw)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
export const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
