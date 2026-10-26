/**
 * Ý tưởng khách gõ ở trang giới thiệu trước khi có tài khoản. Lưu tạm trên trình duyệt để lần đầu mở Studio
 * thì form được điền sẵn (link xác thực email thường mở tab mới nên dùng localStorage, không dùng sessionStorage).
 */
const KEY = "taletale-landing-idea";
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

export type LandingIdea = { topic: string; genre: string | null };

export function saveLandingIdea(idea: LandingIdea) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...idea, at: Date.now() })); } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
}

/** Lấy ra một lần rồi xoá. Quá 7 ngày thì bỏ. */
export function takeLandingIdea(): LandingIdea | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const v = JSON.parse(raw) as LandingIdea & { at?: number };
    if (!v.topic?.trim() || !v.at || Date.now() - v.at > MAX_AGE_MS) return null;
    return { topic: v.topic, genre: v.genre ?? null };
  } catch {
    return null;
  }
}
