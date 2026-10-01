import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
 testDir: "./tests/billing", testMatch: "flow.spec.ts", workers: 1, timeout: 90_000,
 use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3103", screenshot: "only-on-failure", trace: "retain-on-failure" },
 webServer: [
  { command: "node tests/billing/local-supabase.mjs", url: "http://127.0.0.1:3197", reuseExistingServer: true },
  { command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3103", url: "http://127.0.0.1:3103", reuseExistingServer: true, timeout: 120_000,
   env: { SUPABASE_URL: "http://127.0.0.1:3197", SUPABASE_SERVICE_ROLE_KEY: "fixture-service", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3197", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-public", ADMIN_EMAIL: "admin@example.invalid", ADMIN_PASSWORD: "fixture-password", ADMIN_AUTH_SECRET: "fixture-secret-at-least-32-characters-long", RESEND_API_KEY: "", NEXT_PUBLIC_ADS_ENABLED: "false" } },
 ],
});
