import { expect, test } from '@playwright/test';

for (const strategy of ['merge', 'nest', 'first'] as const) {
  const route = `overlap-${strategy}`;
  test(`overlap-${strategy} light`, async ({ page }) => {
    await page.goto(`/${route}`);
    await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(`overlap-${strategy}-light.png`);
  });
  test(`overlap-${strategy} dark`, async ({ page }) => {
    await page.goto(`/dark/${route}`);
    await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(`overlap-${strategy}-dark.png`);
  });
}
