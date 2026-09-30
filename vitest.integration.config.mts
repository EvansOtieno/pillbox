import { defineConfig } from "vitest/config";

// Tests against the running local Supabase stack, using the keys in .env.local.
process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
  },
});
