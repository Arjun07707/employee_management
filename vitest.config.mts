import path from "node:path";

import { defineConfig } from "vitest/config";

const root = process.cwd();

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^server-only$/,
        replacement: path.resolve(root, "tests/mocks/server-only.ts"),
      },
      { find: "@", replacement: path.resolve(root, "src") },
    ],
  },
  test: {
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
