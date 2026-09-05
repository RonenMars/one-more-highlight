import { expect, test } from '@playwright/test';

test('ranges light', async ({ page }) => {
  await page.goto('/ranges');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('ranges-light.png');
});

test('ranges dark', async ({ page }) => {
  await page.goto('/dark/ranges');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('ranges-dark.png');
});
