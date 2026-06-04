// Vitest config (FLOWS §15). Unit test Service = no DB (DAL + transaction di-mock).
// Path alias "@/*" → src/* via resolusi tsconfig native Vite (baca tsconfig.json).
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration test DAL (Testcontainers) = direktori terpisah, fase later.
    exclude: ["**/node_modules/**", "src/**/__tests__/integration/**"],
  },
});
