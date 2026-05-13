import { expect, test } from '@playwright/test';

test('regex light', async ({ page }) => {
  await page.goto('/regex');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('regex-light.png');
});

test('regex dark', async ({ page }) => {
  await page.goto('/dark/regex');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('regex-dark.png');
});
