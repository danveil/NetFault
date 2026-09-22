import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    {
      name: "narrow-mobile-chromium",
      testMatch: /academy.*\.spec\.ts/,
      use: {
        ...devices["iPhone 11"],
        defaultBrowserType: "chromium",
        channel: "msedge",
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Edge"], channel: "msedge", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["iPhone 11"],
        defaultBrowserType: "chromium",
        channel: "msedge",
        viewport: { width: 414, height: 896 },
      },
    },
  ],
  webServer: {
    command: process.env.PW_PRODUCTION ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
