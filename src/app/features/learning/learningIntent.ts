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

/** Chặng đích khi chọn truyện từ Thư viện: số chặng có sẵn, "new" = chặng mới ở cuối, null = chưa chọn (hỏi trong hộp thoại thêm). */
export type PickStage = number | "new" | null;
export interface LibraryPick { childId: number; stage: PickStage }

/** Đọc giá trị đã lưu của PICK_KEY: dạng JSON `{ childId, stage }`, hoặc dạng cũ là một số (chỉ có bé). */
export function parseLibraryPick(raw: string | null): LibraryPick | null {
  if (raw === null) return null;
  if (/^\d+$/.test(raw)) return Number(raw) > 0 ? { childId: Number(raw), stage: null } : null;
  try {
    const v = JSON.parse(raw) as { childId?: unknown; stage?: unknown } | null;
    if (!v || typeof v.childId !== "number" || !Number.isInteger(v.childId) || v.childId <= 0) return null;
    // Số chặng hoặc mã bé không dương là giá trị hỏng: bỏ cả lượt chọn.
    if (typeof v.stage === "number" && (!Number.isInteger(v.stage) || v.stage <= 0)) return null;
    const stage = v.stage === "new" ? "new" : typeof v.stage === "number" ? v.stage : null;
    return { childId: v.childId, stage };
  } catch { return null; }
}

/** Mở Thư viện để chọn truyện cho một bé; `stage` là chặng muốn thêm vào (số chặng, hoặc "new" = chặng mới). */
export function pickStoryInLibrary(go: (id: WorkspaceId) => void, childId: number, stage?: number | "new") {
  try { sessionStorage.setItem(PICK_KEY, JSON.stringify({ childId, stage: stage ?? null })); } catch { /* trình duyệt chặn lưu trữ: vẫn chuyển trang */ }
  go("library");
}
/** Thư viện đọc bé (và chặng) đang được chọn truyện cho (đọc xong thì xoá; trì hoãn xoá như `take`). */
export const takeLibraryPick = (): LibraryPick | null => {
  try {
    const raw = sessionStorage.getItem(PICK_KEY);
    if (raw !== null) setTimeout(() => { try { sessionStorage.removeItem(PICK_KEY); } catch { /* bỏ qua */ } }, 0);
    return parseLibraryPick(raw);
  } catch { return null; }
};

/** Quay về tab Lộ trình của bé trong trang "Học tập của bé". */
export function backToLearning(go: (id: WorkspaceId) => void, childId: number) {
  put(BACK_KEY, childId);
  go("roadmap");
}
/** Trang "Học tập của bé" đọc bé cần mở lại (đọc xong thì xoá). */
export const takeLearningBack = () => take(BACK_KEY);
