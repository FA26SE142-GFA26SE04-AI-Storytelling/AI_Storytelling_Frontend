import type { AppNotification } from '@/app/types/progress';

/**
 * Thông báo trong app phát sinh từ các bộ máy cục bộ (Luồng 1 Phụ lục A).
 * Backend đã có NotificationController; chế độ thật đọc từ đó, kho này chỉ dùng cho dữ liệu mẫu / dự phòng.
 */
const KEY = 'taletale-notifications:v1';
let cache: AppNotification[] | null = null;

function all(): AppNotification[] {
  if (cache) return cache;
  try { cache = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as AppNotification[]; } catch { cache = []; }
  return cache;
}
function persist() { try { sessionStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* bỏ qua */ } }

export function pushNotification(type: string, payload: Record<string, unknown>) {
  const list = all();
  list.unshift({ id: (list[0]?.id ?? 0) + 1, type, payload: JSON.stringify(payload), status: 'unread', readAt: null, createdAt: new Date().toISOString() });
  persist();
}

export const notificationLocal = {
  list: () => all(),
  markRead(id: number) { const n = all().find((x) => x.id === id); if (n) { n.status = 'read'; n.readAt = new Date().toISOString(); persist(); } },
  markAllRead() { for (const n of all()) if (n.status === 'unread') { n.status = 'read'; n.readAt = new Date().toISOString(); } persist(); },
  remove(id: number) { cache = all().filter((x) => x.id !== id); persist(); },
};
