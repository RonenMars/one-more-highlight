import { expect, test } from '@playwright/test';

test('multi-state light', async ({ page }) => {
  await page.goto('/multi-state');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('multi-state-light.png');
});

test('multi-state dark', async ({ page }) => {
  await page.goto('/dark/multi-state');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('multi-state-dark.png');
});
