import { describe, expect, it } from "vitest";
import { isDuplicateAccount } from "@/app/components/shell/LoginScreen";

describe("isDuplicateAccount", () => {
  it("chỉ gợi ý đăng nhập khi trùng email, không khi trùng tên đăng nhập", () => {
    expect(isDuplicateAccount("Email 'a@b.vn' đã được sử dụng trong hệ thống.")).toBe(true);
    expect(isDuplicateAccount("Tên đăng nhập 'minh' đã tồn tại.")).toBe(false);
    expect(isDuplicateAccount(null)).toBe(false);
  });
});
