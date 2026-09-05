import { expect, test } from '@playwright/test';

test('keyboard-navigation light', async ({ page }) => {
  await page.goto('/keyboard-navigation');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'keyboard-navigation-light.png',
  );
});

test('keyboard-navigation dark', async ({ page }) => {
  await page.goto('/dark/keyboard-navigation');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'keyboard-navigation-dark.png',
  );
});

test('keyboard-navigation light — after ArrowRight moves the roving outline', async ({
  page,
}) => {
  await page.goto('/keyboard-navigation');
  await page.locator('mark').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'keyboard-navigation-arrow-right-light.png',
  );
});
