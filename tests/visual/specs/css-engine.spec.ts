import { expect, test } from '@playwright/test';

// WebKit's ::highlight() background composition renders subtly differently
// between local macOS and CI macOS-arm64 (font hinting, antialiasing).
// Observed CI diff: ~3-4% on webkit/mobile-iphone dark routes only.
// Raised here to 5% to absorb the platform-rendering drift; other specs
// stay on the 1% default.
const screenshotOptions = { maxDiffPixelRatio: 0.05 };

test('css-engine light', async ({ page }) => {
  await page.goto('/css-engine');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'css-engine-light.png',
    screenshotOptions,
  );
});

test('css-engine dark', async ({ page }) => {
  await page.goto('/dark/css-engine');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'css-engine-dark.png',
    screenshotOptions,
  );
});
