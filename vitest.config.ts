// Vitest config (FLOWS §15). Unit test Service = no DB (DAL + transaction di-mock).
// Path alias "@/*" → src/* via resolusi tsconfig native Vite (baca tsconfig.json).
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Batasi worker: default = jumlah core (12 di laptop dev) → lonjakan RAM. Lihat docs/ENGINEERING-RULES.md §2.
    maxWorkers: 2,
    // Integration test DAL (Testcontainers) = direktori terpisah, fase later.
    exclude: ["**/node_modules/**", "src/**/__tests__/integration/**"],
  },
});
