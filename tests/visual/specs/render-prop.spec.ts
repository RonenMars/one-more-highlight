import { expect, test } from '@playwright/test';

test('render-prop light', async ({ page }) => {
  await page.goto('/render-prop');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('render-prop-light.png');
});

test('render-prop dark', async ({ page }) => {
  await page.goto('/dark/render-prop');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('render-prop-dark.png');
});
