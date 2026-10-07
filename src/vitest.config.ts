import { defineConfig } from "vitest/config";

// Test kiểm tra service thật, không dùng dữ liệu mẫu.
export default defineConfig({
  test: { env: { NEXT_PUBLIC_USE_MOCK: "false" } },
});
