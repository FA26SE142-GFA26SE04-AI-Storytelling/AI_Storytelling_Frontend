import { describe, expect, it } from "vitest";
import { qrFileName } from "@/app/features/children/qrImage";

describe("qrFileName", () => {
  it("đặt tên tệp theo tên bé, bỏ dấu tiếng Việt", () => {
    expect(qrFileName("Bé An")).toBe("ma-qr-be-an.png");
    expect(qrFileName("Đức Huy")).toBe("ma-qr-duc-huy.png");
    expect(qrFileName("  Bé   Bình!! ")).toBe("ma-qr-be-binh.png");
  });

  it("tên không còn ký tự dùng được thì lấy tên mặc định", () => {
    expect(qrFileName("🐰")).toBe("ma-qr-cua-be.png");
    expect(qrFileName("")).toBe("ma-qr-cua-be.png");
  });
});
