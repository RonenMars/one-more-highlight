import { expect, test } from '@playwright/test';

test('case-insensitive light', async ({ page }) => {
  await page.goto('/case-insensitive');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('case-insensitive-light.png');
});

test('case-insensitive dark', async ({ page }) => {
  await page.goto('/dark/case-insensitive');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('case-insensitive-dark.png');
});
