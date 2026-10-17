/**
 * Luồng 1 Bước 1.10 / Luồng 3 — hoạt động trong phiên của bé.
 * Phiên tự hết hạn sau 20 phút không hoạt động: không thao tác, không có telemetry, và không đang nghe đọc truyện.
 */
export const KID_IDLE_TIMEOUT_MS = 20 * 60_000;
/** Backend ghi hoạt động tối đa 1 lần / phút, nên frontend cũng báo không quá 1 lần / phút. */
export const KID_ACTIVITY_PING_MS = 60_000;

const EVENT = 'taletale:kid-activity';

/** Ghi nhận bé vẫn đang dùng (gọi khi ghi telemetry, khi đang đọc to truyện…). */
export function markKidActivity() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

export function onKidActivity(handler: () => void): () => void {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Đang phát giọng đọc (giọng trình duyệt hoặc tệp âm thanh) cũng tính là đang hoạt động, kể cả khi bé không chạm màn hình. */
export function isNarrating(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.speechSynthesis?.speaking) return true;
  return Array.from(document.querySelectorAll('audio')).some((a) => !a.paused && !a.ended);
}
