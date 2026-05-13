import { expect, test } from '@playwright/test';

test('headless light', async ({ page }) => {
  await page.goto('/headless');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('headless-light.png');
});

test('headless dark', async ({ page }) => {
  await page.goto('/dark/headless');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('headless-dark.png');
});
