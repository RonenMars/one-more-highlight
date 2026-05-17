import { expect, test } from '@playwright/test';

test('css-engine light', async ({ page }) => {
  await page.goto('/css-engine');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('css-engine-light.png');
});

test('css-engine dark', async ({ page }) => {
  await page.goto('/dark/css-engine');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('css-engine-dark.png');
});
