import path from "node:path";
import { defineConfig } from "vitest/config";

// Test kiểm tra service thật, không dùng dữ liệu mẫu.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { env: { NEXT_PUBLIC_USE_MOCK: "false" } },
});
