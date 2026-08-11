import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./"),
    },
  },
  test: {
    coverage: {
      exclude: [
        "**/*.config.{js,ts,mjs,mts}",
        "**/*.d.ts",
        "app/layout.tsx",
        "coverage/**",
        "node_modules/**",
        "tests/**",
      ],
      include: ["app/page.tsx", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
