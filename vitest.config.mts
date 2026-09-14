import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Unit tests only (utils/config, pure functions) — mirrors tsconfig's "@/*"
// alias so test files can import the same way app code does.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
