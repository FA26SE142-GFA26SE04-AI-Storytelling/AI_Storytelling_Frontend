/**
 * Hồ sơ bé vừa lưu trữ trên trình duyệt này, để còn nút "Khôi phục".
 * Backend có `PATCH /ChildProfile/{id}/restore` nhưng chưa có API liệt kê hồ sơ đã lưu trữ, nên nhớ tạm ở đây.
 * Chỉ là tiện ích cho người dùng: mất dữ liệu trình duyệt thì chỉ mất nút khôi phục, hồ sơ trên máy chủ không đổi.
 */
export interface ArchivedChild { id: number; nickname: string; archivedAt: string }

const key = (userId: number) => `tt.archivedChildren.${userId}`;

export function listArchived(userId: number): ArchivedChild[] {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as ArchivedChild[]) : [];
  } catch {
    return [];
  }
}

function save(userId: number, list: ArchivedChild[]) {
  try { localStorage.setItem(key(userId), JSON.stringify(list.slice(0, 20))); } catch { /* trình duyệt chặn lưu: bỏ qua */ }
}

export function rememberArchived(userId: number, child: { id: number; nickname: string }) {
  save(userId, [{ id: child.id, nickname: child.nickname, archivedAt: new Date().toISOString() }, ...listArchived(userId).filter((c) => c.id !== child.id)]);
}

export function forgetArchived(userId: number, id: number) {
  save(userId, listArchived(userId).filter((c) => c.id !== id));
}
