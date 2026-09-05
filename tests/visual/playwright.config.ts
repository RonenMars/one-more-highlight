import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, scale: 'device' },
  },
  projects: [
    { name: 'chromium',       use: { ...devices['Desktop Chrome'],  deviceScaleFactor: 2 } },
    { name: 'firefox',        use: { ...devices['Desktop Firefox'], deviceScaleFactor: 2 } },
    { name: 'webkit',         use: { ...devices['Desktop Safari'],  deviceScaleFactor: 2 } },
    { name: 'mobile-iphone',  use: { ...devices['iPhone 14 Pro'] } },
    { name: 'mobile-android', use: { ...devices['Galaxy S24'] } },
  ],
  webServer: {
    // --strictPort + never reusing an existing server: if anything else holds
    // 5173 the run fails loudly instead of silently screenshotting that app.
    command: 'pnpm --filter one-more-highlight-playground dev --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
