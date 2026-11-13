import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import qrcode from "qrcode-generator";
import { readKidCode } from "@/app/features/kid/kidQrCode";

/** Vẽ QR giống components/QrCode.tsx (mức sửa lỗi M, lề 2 ô, nền trắng) ra mảng điểm ảnh RGBA. */
function renderQr(value: string, cell = 4) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount() + 4;
  const size = n * cell;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = Math.floor(y / cell) - 2, c = Math.floor(x / cell) - 2;
    if (r >= 0 && c >= 0 && r < n - 4 && c < n - 4 && qr.isDark(r, c)) data.fill(0, (y * size + x) * 4, (y * size + x) * 4 + 3);
  }
  return { data, size };
}

// Mã Easy Login backend tạo: 32 byte ngẫu nhiên, base64url (43 ký tự).
const SECRET = "q8Zr3-Xw_9LkP2mVn7bTc4YhJd6sGf1aRe0uWiOyQxA";

describe("readKidCode", () => {
  it("lấy mã từ link QR do trang Quyền truy cập tạo", () => {
    expect(readKidCode(`https://taletale.site/?kid=${SECRET}`)).toBe(SECRET);
  });

  it("nhận link có mã đã mã hoá URL và tham số khác", () => {
    expect(readKidCode(`http://localhost:3000/?a=1&kid=${encodeURIComponent(SECRET)}#x`)).toBe(SECRET);
  });

  it("nhận QR chỉ chứa mã, bỏ khoảng trắng hai đầu", () => {
    expect(readKidCode(`  ${SECRET}\n`)).toBe(SECRET);
  });

  it("bỏ qua link không có mã của bé", () => {
    expect(readKidCode("https://example.com/khuyen-mai")).toBeNull();
    expect(readKidCode("https://taletale.site/?kid=")).toBeNull();
  });

  it("bỏ qua mã sai định dạng hoặc giao thức lạ", () => {
    expect(readKidCode("https://taletale.site/?kid=abc")).toBeNull();
    expect(readKidCode(`https://taletale.site/?kid=${SECRET}<script>`)).toBeNull();
    expect(readKidCode(`javascript:alert(1)//?kid=${SECRET}`)).toBeNull();
    expect(readKidCode("Xin chào bé")).toBeNull();
    expect(readKidCode("")).toBeNull();
  });

  it("đọc lại được mã từ QR do trang Quyền truy cập vẽ", () => {
    const { data, size } = renderQr(`https://taletale.site/?kid=${encodeURIComponent(SECRET)}`);
    const text = jsQR(data, size, size)?.data ?? "";
    expect(readKidCode(text)).toBe(SECRET);
  });
});
