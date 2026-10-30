import path from "node:path";
import { defineConfig } from "vitest/config";

// Test kiểm tra service thật, không dùng dữ liệu mẫu.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
});
