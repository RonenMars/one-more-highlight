import { expect, test } from '@playwright/test';

// 'dual' and 'annotated' add visually-hidden text alongside the visible
// markup — these snapshots should be pixel-identical to 'native'. That is
// expected, not a bug: the point of this suite is to guard against the
// hidden layers accidentally becoming visible.
for (const mode of ['native', 'dual', 'annotated'] as const) {
  test(`accessible-highlight ${mode} light`, async ({ page }) => {
    await page.goto('/accessible-highlight');
    await page.locator('select').selectOption(mode);
    await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
      `accessible-highlight-${mode}-light.png`,
    );
  });

  test(`accessible-highlight ${mode} dark`, async ({ page }) => {
    await page.goto('/dark/accessible-highlight');
    await page.locator('select').selectOption(mode);
    await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
      `accessible-highlight-${mode}-dark.png`,
    );
  });
}
