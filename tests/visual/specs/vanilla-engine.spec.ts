import { expect, test } from '@playwright/test';

// Same platform-rendering allowance as css-engine.spec.ts: the left column
// paints with ::highlight(), whose background composition drifts a few percent
// between local macOS and CI macOS-arm64 on webkit. The right column is plain
// <mark> and is unaffected.
const screenshotOptions = { maxDiffPixelRatio: 0.05 };

test('vanilla-engine light', async ({ page }) => {
  await page.goto('/vanilla-engine');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'vanilla-engine-light.png',
    screenshotOptions,
  );
});

test('vanilla-engine dark', async ({ page }) => {
  await page.goto('/dark/vanilla-engine');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(
    'vanilla-engine-dark.png',
    screenshotOptions,
  );
});

// The screenshots above prove the painting. These assert the behavior behind
// it — that the engine really walked the DOM and really left it alone — which
// pixels alone cannot distinguish.
test('vanilla-engine matches across an element boundary without touching the DOM', async ({
  page,
}) => {
  await page.goto('/vanilla-engine');
  const demo = page.locator('[data-testid="demo"]');
  await expect(demo).toBeVisible();

  const cssColumn = demo.locator('.demo-col').first();
  const markColumn = demo.locator('.demo-col').nth(1);

  // Headings report the match count the engine returned. "lazy dog" is split
  // across <strong>, so finding 5 proves cross-element matching worked:
  // four "fox" plus one "lazy dog".
  await expect(cssColumn.locator('h3')).toContainText('5 matches');
  await expect(markColumn.locator('h3')).toContainText('5 matches');

  // The css renderer must not add elements; the mark renderer must. 7, not 5,
  // because one element cannot straddle a text-node boundary: the four "fox"
  // matches wrap once each, and "lazy dog" needs three wrappers for the three
  // text nodes it spans ("la" / "zy do" / "g").
  await expect(cssColumn.locator('mark')).toHaveCount(0);
  await expect(markColumn.locator('mark')).toHaveCount(7);

  // The cross-element match really is registered as one Range spanning it.
  const painted = await page.evaluate(() =>
    [...(CSS.highlights.get('v-term-dog') ?? [])].map((r) => r.toString()),
  );
  expect(painted).toEqual(['lazy dog']);
});
