import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // The backend keeps its posts in memory, so tests that publish must not overlap.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Runs against the production build: cache tags and the Secure cookie
    // flag behave differently under `next dev`.
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
