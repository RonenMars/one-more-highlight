import { expect, test } from '@playwright/test';

test('per-term light', async ({ page }) => {
  await page.goto('/per-term');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('per-term-light.png');
});

test('per-term dark', async ({ page }) => {
  await page.goto('/dark/per-term');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('per-term-dark.png');
});
