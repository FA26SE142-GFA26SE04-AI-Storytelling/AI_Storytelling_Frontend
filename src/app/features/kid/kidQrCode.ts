import jsQR from "jsqr";

/** Mã Easy Login backend tạo là chuỗi base64url (32 byte ngẫu nhiên → 43 ký tự). */
const SECRET = /^[A-Za-z0-9_-]{20,200}$/;

/**
 * Lấy mã Easy Login từ nội dung QR. QR do trang Quyền truy cập tạo là link `…?kid=<mã>`; cũng nhận QR chỉ chứa mã.
 * Nội dung khác (link web lạ, chữ) trả null: màn quét không bao giờ mở link trong QR, chỉ gửi mã cho backend.
 */
export function readKidCode(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;
  if (SECRET.test(raw)) return raw;
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const code = url.searchParams.get("kid")?.trim() ?? "";
  return SECRET.test(code) ? code : null;
}

/**
 * Đọc QR trong một khung hình (camera) hoặc ảnh. Thu nhỏ về cạnh dài `maxSide` cho nhanh.
 * `thorough`: thử cả ảnh đảo màu (QR sáng trên nền tối), chậm hơn nên chỉ dùng cho ảnh tải lên.
 */
export function decodeQr(source: CanvasImageSource, width: number, height: number, canvas: HTMLCanvasElement, maxSide: number, thorough = false): string | null {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, canvas.width, canvas.height, { inversionAttempts: thorough ? "attemptBoth" : "dontInvert" })?.data ?? null;
}
