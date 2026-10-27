/**
 * Mở màn "Hồ sơ bé" thẳng vào form "Thêm bé" từ màn khác (VD nút "+ Thêm bé" ở Tổng quan).
 * Dùng sessionStorage như STUDIO_PREFILL_KEY: đặt cờ trước khi chuyển màn, màn Hồ sơ bé đọc rồi xoá.
 */
const KEY = "taletale-children-intent";

export function openChildCreate(go: (id: "children") => void) {
  try { sessionStorage.setItem(KEY, "create"); } catch { /* trình duyệt chặn lưu trữ: vẫn mở màn Hồ sơ bé */ }
  go("children");
}

/** Có yêu cầu mở form "Thêm bé" không (chỉ đọc, chưa xoá). */
export function wantsChildCreate(): boolean {
  try { return sessionStorage.getItem(KEY) === "create"; } catch { return false; }
}

export function clearChildIntent() {
  try { sessionStorage.removeItem(KEY); } catch { /* bỏ qua */ }
}
