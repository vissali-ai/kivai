import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/cms",
  testMatch: "publication.spec.ts",
  workers: 1,
  timeout: 60_000,
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3102", screenshot: "only-on-failure" },
  webServer: [
    { command: "node tests/cms/fixtures/publication-db.mjs", url: "http://127.0.0.1:3198", reuseExistingServer: false },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3102",
      url: "http://127.0.0.1:3102",
      timeout: 120_000,
      reuseExistingServer: false,
      env: { SUPABASE_URL: "http://127.0.0.1:3198", SUPABASE_SERVICE_ROLE_KEY: "local-test-only", NEXT_PUBLIC_ADS_ENABLED: "false" },
    },
  ],
});
