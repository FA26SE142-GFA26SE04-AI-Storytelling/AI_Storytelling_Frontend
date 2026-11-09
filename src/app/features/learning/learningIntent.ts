import type { WorkspaceId } from "@/app/components/shell/nav";

/**
 * Đi qua lại giữa trang "Học tập của bé" và Thư viện khi thêm truyện vào lộ trình.
 * Dùng sessionStorage như childrenIntent: đặt trước khi chuyển trang, trang đích đọc một lần rồi xoá.
 */
const PICK_KEY = "taletale-roadmap-pick";
const BACK_KEY = "taletale-learning-back";

/**
 * Đọc rồi mới xoá ở lượt sau: ở chế độ phát triển, React (Strict Mode) chạy useEffect khởi tạo hai lần liên tiếp;
 * xoá ngay thì lần thứ hai đọc ra null và ghi đè mất giá trị của lần đầu.
 */
const take = (key: string): number | null => {
  try {
    const v = sessionStorage.getItem(key);
    if (v !== null) setTimeout(() => { try { sessionStorage.removeItem(key); } catch { /* bỏ qua */ } }, 0);
    return v && /^\d+$/.test(v) ? Number(v) : null;
  } catch { return null; }
};
const put = (key: string, childId: number) => {
  try { sessionStorage.setItem(key, String(childId)); } catch { /* trình duyệt chặn lưu trữ: vẫn chuyển trang */ }
};

/** Mở Thư viện để chọn truyện cho một bé. */
export function pickStoryInLibrary(go: (id: WorkspaceId) => void, childId: number) {
  put(PICK_KEY, childId);
  go("library");
}
/** Thư viện đọc bé đang được chọn truyện cho (đọc xong thì xoá). */
export const takeLibraryPick = () => take(PICK_KEY);

/** Quay về tab Lộ trình của bé trong trang "Học tập của bé". */
export function backToLearning(go: (id: WorkspaceId) => void, childId: number) {
  put(BACK_KEY, childId);
  go("roadmap");
}
/** Trang "Học tập của bé" đọc bé cần mở lại (đọc xong thì xoá). */
export const takeLearningBack = () => take(BACK_KEY);
