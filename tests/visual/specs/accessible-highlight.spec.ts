import { expect, test } from '@playwright/test';

// 'dual' and 'annotated' add visually-hidden text alongside the visible
// markup, so all three modes must be pixel-identical. That is the whole
// point of this suite: any difference means a hidden layer has become
// visible.
//
// Captures the component's output rather than [data-testid="demo"], because
// the demo's mode picker renders its own selected value — snapshotting the
// wrapper made the three images differ for a reason unrelated to
// highlighting, which silently weakened the guarantee above.
for (const mode of ['native', 'dual', 'annotated'] as const) {
  test(`accessible-highlight ${mode} light`, async ({ page }) => {
    await page.goto('/accessible-highlight');
    await page.locator('select').selectOption(mode);
    await expect(page.locator('[data-testid="a11y-output"]')).toHaveScreenshot(
      `accessible-highlight-${mode}-light.png`,
    );
  });

  test(`accessible-highlight ${mode} dark`, async ({ page }) => {
    await page.goto('/dark/accessible-highlight');
    await page.locator('select').selectOption(mode);
    await expect(page.locator('[data-testid="a11y-output"]')).toHaveScreenshot(
      `accessible-highlight-${mode}-dark.png`,
    );
  });
}
