import { expect, test } from '@playwright/test';

test('basic light', async ({ page }) => {
  await page.goto('/basic');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('basic-light.png');
});

test('basic dark', async ({ page }) => {
  await page.goto('/dark/basic');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('basic-dark.png');
});
