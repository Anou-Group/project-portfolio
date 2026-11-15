import { defineConfig, devices } from "@playwright/test";

/**
 * Journeys run against a production build reading the content files (no database),
 * on its own port. Set E2E_BASE_URL to run the same suite against a deployed site.
 */
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: external ?? "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: external
    ? undefined
    : {
        command: "npm run build && npx next start -p 3100",
        url: "http://localhost:3100",
        env: { PORTFOLIO_DATA_SOURCE: "content" },
        timeout: 240_000,
        reuseExistingServer: false,
      },
});
