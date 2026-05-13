# Design: Playwright Visual Regression Tests

**Date:** 2026-05-13  
**Status:** Approved

## Overview

Add cross-browser Playwright visual regression tests for `one-more-highlight`'s rendered output. The `examples/playground` app becomes the canonical visual fixture, expanded to cover all library features. A `tests/visual/` directory at the repo root contains the Playwright config and specs. On every PR and push to `main`, a Mac CI runner compares screenshots against committed baselines and fails if any diff exceeds the threshold.

---

## Section 1: Playground App Structure

The `examples/playground` app gets React Router added. The main page (`/`) shows the BasicDemo. All other demos get their own routes. Dark mode is reflected in the URL as a `/dark/` prefix.

### Route structure

```
/                     → BasicDemo (light)
/dark                 → BasicDemo (dark)
/multi-state          → MultiStateDemo (light)
/dark/multi-state     → MultiStateDemo (dark)
/render-prop          → RenderPropDemo (light)
/dark/render-prop     → RenderPropDemo (dark)
/headless             → HeadlessDemo (light)
/dark/headless        → HeadlessDemo (dark)
/overlap-merge        → OverlapMergeDemo (light)
/dark/overlap-merge   → OverlapMergeDemo (dark)
/overlap-nest         → OverlapNestDemo (light)
/dark/overlap-nest    → OverlapNestDemo (dark)
/overlap-first        → OverlapFirstDemo (light)
/dark/overlap-first   → OverlapFirstDemo (dark)
/regex                → RegexDemo (light)
/dark/regex           → RegexDemo (dark)
/case-insensitive     → CaseInsensitiveDemo (light)
/dark/case-insensitive → CaseInsensitiveDemo (dark)
/selectors            → SelectorsDemo (light)
/dark/selectors       → SelectorsDemo (dark)
```

### File layout

```
examples/playground/src/
├── demos/
│   ├── BasicDemo.tsx           (moved from components/)
│   ├── MultiStateDemo.tsx      (moved)
│   ├── RenderPropDemo.tsx      (moved)
│   ├── HeadlessDemo.tsx        (moved)
│   ├── OverlapMergeDemo.tsx    (new)
│   ├── OverlapNestDemo.tsx     (new)
│   ├── OverlapFirstDemo.tsx    (new)
│   ├── RegexDemo.tsx           (new)
│   ├── CaseInsensitiveDemo.tsx (new)
│   └── SelectorsDemo.tsx       (new — match.one, match.range, match.many)
├── ThemeWrapper.tsx            (new — reads /dark/ prefix, sets data-theme)
├── ThemeToggle.tsx             (new — sun/moon button, navigates /dark/ ↔ light)
├── App.tsx                     (updated — React Router routes)
└── index.css                   (updated — CSS variables + transitions)
```

---

## Section 2: New Demo Components

Each demo is self-contained — no shared state, all colors via CSS variables.

| Component | Feature demonstrated |
|---|---|
| `OverlapMergeDemo` | Two overlapping terms, `strategy="merge"` |
| `OverlapNestDemo` | Same terms, `strategy="nest"` |
| `OverlapFirstDemo` | Same terms, `strategy="first-wins"` |
| `RegexDemo` | `RegExp` search word, e.g. `/\btime\b/` |
| `CaseInsensitiveDemo` | `caseSensitive={false}` vs `caseSensitive={true}` side by side |
| `SelectorsDemo` | Three sub-examples: `match.one(2)`, `match.range(1,3)`, `match.many([0,2,4])` |

---

## Section 3: Dark Mode Implementation

### CSS variables

```css
:root {
  --bg: #ffffff;
  --text: #1b1b1d;
  --highlight-yellow: #FFEFA0;
  --highlight-mint: #5EEAD4;
  --highlight-pink: #FF8FB5;
  --surface: #f5f5f5;
  transition: background-color 0.3s ease, color 0.3s ease;
}

[data-theme="dark"] {
  --bg: #1b1b1d;
  --text: #fafafa;
  --highlight-yellow: #b8a000;
  --highlight-mint: #0d9488;
  --highlight-pink: #be185d;
  --surface: #2d2d2d;
}
```

### ThemeWrapper

- Wraps the entire app
- Reads the current route — if it starts with `/dark/` or equals `/dark`, sets `data-theme="dark"` on a full-viewport `<div>`
- All demo components use CSS variables for colors, backgrounds, and borders — no hardcoded values

### ThemeToggle

- Sun/moon icon button positioned top-right above each demo
- On click: navigates between `/<route>` ↔ `/dark/<route>`
- Icon animates: 180° rotation on theme switch via CSS `transform: rotate` + `transition`
- Button itself has a background/color transition matching the theme crossfade

---

## Section 4: Playwright Test Setup

### Directory structure

```
tests/visual/
├── playwright.config.ts
├── snapshots/              ← committed PNG baselines (Mac-generated)
│   ├── basic/
│   ├── multi-state/
│   ├── overlap-merge/
│   └── ...                 (one dir per demo)
└── specs/
    ├── basic.spec.ts
    ├── multi-state.spec.ts
    ├── overlap.spec.ts
    ├── regex.spec.ts
    ├── case-insensitive.spec.ts
    ├── selectors.spec.ts
    ├── render-prop.spec.ts
    └── headless.spec.ts
```

### Playwright config

- `webServer`: starts `pnpm dev` in `examples/playground` before tests, tears down after
- `projects`: Chromium, Firefox, WebKit
- `snapshotDir`: `./snapshots`
- `expect.toHaveScreenshot`: tight threshold, e.g. `maxDiffPixelRatio: 0.01`
- Each spec screenshots the light route and the `/dark/<route>` variant
- **6 PNGs per demo** (2 themes × 3 browsers)

### Spec pattern (example)

```ts
test('basic - light', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('basic-light.png');
});

test('basic - dark', async ({ page }) => {
  await page.goto('/dark');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('basic-dark.png');
});
```

Each demo component gets a `data-testid="demo"` wrapper so Playwright screenshots just the component, not the full viewport.

---

## Section 5: Scripts & Developer Workflow

### Root package.json scripts

```json
"test:visual":        "playwright test --config tests/visual/playwright.config.ts",
"test:visual:update": "playwright test --config tests/visual/playwright.config.ts --update-snapshots",
"test:visual:ui":     "playwright test --config tests/visual/playwright.config.ts --ui"
```

### Developer workflow (PR with visual changes)

1. Make code changes
2. `pnpm test:visual` — fails, shows diff report
3. `pnpm test:visual:update` — regenerates baselines on Mac
4. Commit updated PNGs alongside code changes
5. Push — CI passes

### First-time baseline generation

Run `pnpm test:visual:update` on Mac. Commit all generated PNGs under `tests/visual/snapshots/`.

---

## Section 6: CI Integration

### Trigger

- `pull_request` (opened, synchronized, reopened)
- `push` to `main`

CI **never** auto-updates snapshots. It only validates. A diff above the threshold fails the job.

### GitHub Actions job

```yaml
visual:
  runs-on: macos-latest
  steps:
    - uses: actions/checkout@v6
    - uses: pnpm/action-setup@v6
    - uses: actions/setup-node@v6
      with:
        node-version: 24
        cache: pnpm
    - run: pnpm install
    - run: pnpm --filter ./examples/playground... build  # build library first
    - run: npx playwright install --with-deps
    - run: pnpm test:visual
```

The job runs independently of the existing `release` CI job — no blocking dependency between them.
