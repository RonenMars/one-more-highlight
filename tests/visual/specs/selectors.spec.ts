import { expect, test } from '@playwright/test';

test('selectors light', async ({ page }) => {
  await page.goto('/selectors');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('selectors-light.png');
});

test('selectors dark', async ({ page }) => {
  await page.goto('/dark/selectors');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('selectors-dark.png');
});
