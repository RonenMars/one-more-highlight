# Playwright Visual Regression Tests Implementation Plan

> **Status:** ✅ Completed 2026-05-13. All 12 tasks shipped — routed playground with light/dark themes, 10 demo components, 60 baseline snapshots (10 demos × 2 themes × 3 browsers), CI visual job on `macos-latest`. Released as part of v0.4.0.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the playground app with React Router + new demo components + dark mode, then add cross-browser Playwright visual regression tests and a CI job.

**Architecture:** The playground (`examples/playground`) becomes a routed app — each demo lives at its own path, dark mode is a `/dark` URL prefix, and a `ThemeWrapper` reads the path to set `data-theme`. Playwright runs from `tests/visual/` against the playground dev server, capturing one screenshot per demo × theme × browser, compared against committed PNG baselines.

**Tech Stack:** React Router v7 (hash router — no server needed), Playwright, Vite, pnpm workspaces, GitHub Actions (macos-latest).

---

## File Map

### Playground — modified
- `examples/playground/package.json` — add `react-router-dom` dep
- `examples/playground/src/index.css` — add CSS vars for light/dark + transition + demo token classes
- `examples/playground/src/main.tsx` — wrap app in `BrowserRouter`
- `examples/playground/src/App.tsx` — replace monolithic render with `<Routes>`
- `examples/playground/src/demos/HeadlessDemo.tsx` — fix: use `segments` from `useHighlight` result object (breaking change from v0.4)

### Playground — new
- `examples/playground/src/ThemeWrapper.tsx` — reads route, sets `data-theme="dark"` when path starts with `/dark`
- `examples/playground/src/ThemeToggle.tsx` — sun/moon button that navigates between light/dark route variants
- `examples/playground/src/demos/OverlapMergeDemo.tsx`
- `examples/playground/src/demos/OverlapNestDemo.tsx`
- `examples/playground/src/demos/OverlapFirstDemo.tsx`
- `examples/playground/src/demos/RegexDemo.tsx`
- `examples/playground/src/demos/CaseInsensitiveDemo.tsx`
- `examples/playground/src/demos/SelectorsDemo.tsx`

### Visual tests — new
- `tests/visual/playwright.config.ts`
- `tests/visual/specs/basic.spec.ts`
- `tests/visual/specs/multi-state.spec.ts`
- `tests/visual/specs/overlap.spec.ts`
- `tests/visual/specs/regex.spec.ts`
- `tests/visual/specs/case-insensitive.spec.ts`
- `tests/visual/specs/selectors.spec.ts`
- `tests/visual/specs/render-prop.spec.ts`
- `tests/visual/specs/headless.spec.ts`

### Root — modified
- `package.json` — add `test:visual`, `test:visual:update`, `test:visual:ui` scripts; add `@playwright/test` as devDep
- `.github/workflows/ci.yml` — add `visual` job on `macos-latest`

---

## Task 1: Fix HeadlessDemo for v0.4 API

The `useHighlight` hook now returns `{ segments, getMatchCount }` instead of a bare array. `HeadlessDemo.tsx` uses the old API and will blow up at runtime.

**Files:**
- Modify: `examples/playground/src/demos/HeadlessDemo.tsx`

- [ ] **Step 1: Update HeadlessDemo to destructure `segments`**

Replace `examples/playground/src/demos/HeadlessDemo.tsx` with:

```tsx
import { match, useHighlight } from 'one-more-highlight';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export function HeadlessDemo() {
  const { segments } = useHighlight({
    text,
    searchWords: ['time'],
    states: [{ name: 'active', ...match.one(2) }],
  });
  return (
    <p>
      {segments.map((s, i) =>
        s.isMatch ? (
          <mark key={i} data-states={s.states.join(' ')} className="hl-base">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
```

- [ ] **Step 2: Verify the playground builds**

```bash
cd examples/playground && pnpm build 2>&1 | tail -5
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add examples/playground/src/demos/HeadlessDemo.tsx
git commit -m "fix(playground): update HeadlessDemo to useHighlight v0.4 API"
```

---

## Task 2: Add CSS variables + demo token classes

Replace the playground's CSS with a full light/dark variable system. All demo components use these token classes — no hardcoded colors anywhere.

**Files:**
- Modify: `examples/playground/src/index.css` (currently referenced from `main.tsx` — check if it exists; if not, create it and add `import './index.css'` to `main.tsx`)

- [ ] **Step 1: Write `examples/playground/src/index.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #ffffff;
  --text: #1b1b1d;
  --surface: #f5f5f5;
  --border: #e0e0e0;
  --hl-yellow: #FFEFA0;
  --hl-mint: #5EEAD4;
  --hl-pink: #FF8FB5;
  --hl-orange: #FFBF69;
}

[data-theme="dark"] {
  --bg: #1b1b1d;
  --text: #fafafa;
  --surface: #2d2d2d;
  --border: #444;
  --hl-yellow: #b8a000;
  --hl-mint: #0d9488;
  --hl-pink: #be185d;
  --hl-orange: #d97706;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Layout */
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.demo-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

[data-testid="demo"] {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  line-height: 1.8;
}

/* Theme toggle button */
.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem 0.5rem;
  color: var(--text);
  transition: transform 0.3s ease;
}

.theme-toggle:hover { opacity: 0.75; }

/* Highlight token classes */
.hl-base     { background: var(--hl-yellow); border-radius: 2px; }
.hl-preview  { background: var(--hl-mint); }
.hl-active   { background: var(--hl-orange); outline: 2px solid currentColor; outline-offset: 1px; }
.hl-bookmark { text-decoration: underline; }
.hl-a        { background: var(--hl-yellow); }
.hl-b        { background: var(--hl-mint); }
.hl-one      { background: var(--hl-orange); }
.hl-range    { background: var(--hl-mint); }
.hl-many     { background: var(--hl-pink); }

/* Side-by-side layout for CaseInsensitiveDemo */
.demo-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.demo-col h3 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
  opacity: 0.7;
}
```

- [ ] **Step 2: Check if `main.tsx` already imports a CSS file**

```bash
grep -n "css" examples/playground/src/main.tsx
```

If no CSS import exists, add `import './index.css';` as the first line of `main.tsx`.

- [ ] **Step 3: Commit**

```bash
git add examples/playground/src/index.css examples/playground/src/main.tsx
git commit -m "feat(playground): add CSS variable system for light/dark theming"
```

---

## Task 3: Add `react-router-dom` to playground

**Files:**
- Modify: `examples/playground/package.json`

- [ ] **Step 1: Add react-router-dom**

```bash
cd examples/playground && pnpm add react-router-dom
```

- [ ] **Step 2: Verify it installed**

```bash
grep react-router-dom examples/playground/package.json
```

Expected: `"react-router-dom": "^7.x.x"` (or similar).

- [ ] **Step 3: Commit**

```bash
git add examples/playground/package.json pnpm-lock.yaml
git commit -m "feat(playground): add react-router-dom for demo routing"
```

---

## Task 4: Add ThemeWrapper and ThemeToggle components

**Files:**
- Create: `examples/playground/src/ThemeWrapper.tsx`
- Create: `examples/playground/src/ThemeToggle.tsx`

- [ ] **Step 1: Create `ThemeWrapper.tsx`**

```tsx
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export function ThemeWrapper({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isDark = pathname === '/dark' || pathname.startsWith('/dark/');
  return (
    <div data-theme={isDark ? 'dark' : undefined} style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `ThemeToggle.tsx`**

```tsx
import { useLocation, useNavigate } from 'react-router-dom';

export function ThemeToggle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isDark = pathname === '/dark' || pathname.startsWith('/dark/');

  function toggle() {
    if (isDark) {
      // /dark → /  or  /dark/foo → /foo
      navigate(pathname === '/dark' ? '/' : pathname.slice('/dark'.length));
    } else {
      // / → /dark  or  /foo → /dark/foo
      navigate(pathname === '/' ? '/dark' : '/dark' + pathname);
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add examples/playground/src/ThemeWrapper.tsx examples/playground/src/ThemeToggle.tsx
git commit -m "feat(playground): add ThemeWrapper and ThemeToggle components"
```

---

## Task 5: Add six new demo components

**Files:**
- Create: `examples/playground/src/demos/OverlapMergeDemo.tsx`
- Create: `examples/playground/src/demos/OverlapNestDemo.tsx`
- Create: `examples/playground/src/demos/OverlapFirstDemo.tsx`
- Create: `examples/playground/src/demos/RegexDemo.tsx`
- Create: `examples/playground/src/demos/CaseInsensitiveDemo.tsx`
- Create: `examples/playground/src/demos/SelectorsDemo.tsx`

- [ ] **Step 1: Create `OverlapMergeDemo.tsx`**

```tsx
import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

export function OverlapMergeDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="merge"
      highlightClassName="hl-base"
    />
  );
}
```

- [ ] **Step 2: Create `OverlapNestDemo.tsx`**

```tsx
import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

export function OverlapNestDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="nest"
      highlightClassName="hl-base"
    />
  );
}
```

- [ ] **Step 3: Create `OverlapFirstDemo.tsx`**

```tsx
import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

export function OverlapFirstDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="first-wins"
      highlightClassName="hl-base"
    />
  );
}
```

- [ ] **Step 4: Create `RegexDemo.tsx`**

```tsx
import { Highlight } from 'one-more-highlight';

const text =
  'We need time. Not just any time — quality time. ' +
  'Overtime is not the same as prime time. Sometimes timing is everything.';

export function RegexDemo() {
  return (
    <Highlight
      text={text}
      searchWords={[/\btime\b/i]}
      highlightClassName="hl-base"
    />
  );
}
```

- [ ] **Step 5: Create `CaseInsensitiveDemo.tsx`**

```tsx
import { Highlight } from 'one-more-highlight';

const text = 'React, react, REACT — three ways to write the same word.';

export function CaseInsensitiveDemo() {
  return (
    <div className="demo-cols">
      <div className="demo-col">
        <h3>caseSensitive=false (default)</h3>
        <Highlight text={text} searchWords={['react']} caseSensitive={false} highlightClassName="hl-base" />
      </div>
      <div className="demo-col">
        <h3>caseSensitive=true</h3>
        <Highlight text={text} searchWords={['react']} caseSensitive={true} highlightClassName="hl-base" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `SelectorsDemo.tsx`**

```tsx
import { Highlight, match } from 'one-more-highlight';

const text = 'time time time time time time';

export function SelectorsDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <small style={{ opacity: 0.6 }}>match.one(2) — index 2 only</small>
        <div>
          <Highlight text={text} searchWords={['time']} highlightClassName="hl-base"
            states={[{ name: 'one', ...match.one(2), className: 'hl-one' }]} />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>match.range(1, 3) — indices 1–3</small>
        <div>
          <Highlight text={text} searchWords={['time']} highlightClassName="hl-base"
            states={[{ name: 'range', ...match.range(1, 3), className: 'hl-range' }]} />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>match.many([0, 2, 4]) — indices 0, 2, 4</small>
        <div>
          <Highlight text={text} searchWords={['time']} highlightClassName="hl-base"
            states={[{ name: 'many', ...match.many([0, 2, 4]), className: 'hl-many' }]} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add examples/playground/src/demos/
git commit -m "feat(playground): add six new demo components for overlap, regex, case, selectors"
```

---

## Task 6: Rewrite App.tsx with React Router routes

**Files:**
- Modify: `examples/playground/src/App.tsx`
- Modify: `examples/playground/src/main.tsx`

- [ ] **Step 1: Rewrite `App.tsx`**

```tsx
import { Route, Routes } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.js';
import { ThemeWrapper } from './ThemeWrapper.js';
import { BasicDemo } from './demos/BasicDemo.js';
import { CaseInsensitiveDemo } from './demos/CaseInsensitiveDemo.js';
import { HeadlessDemo } from './demos/HeadlessDemo.js';
import { MultiStateDemo } from './demos/MultiStateDemo.js';
import { OverlapFirstDemo } from './demos/OverlapFirstDemo.js';
import { OverlapMergeDemo } from './demos/OverlapMergeDemo.js';
import { OverlapNestDemo } from './demos/OverlapNestDemo.js';
import { RegexDemo } from './demos/RegexDemo.js';
import { RenderPropDemo } from './demos/RenderPropDemo.js';
import { SelectorsDemo } from './demos/SelectorsDemo.js';

interface DemoPageProps {
  title: string;
  children: React.ReactNode;
}

function DemoPage({ title, children }: DemoPageProps) {
  return (
    <div className="page">
      <div className="demo-header">
        <h2>{title}</h2>
        <ThemeToggle />
      </div>
      <div data-testid="demo">{children}</div>
    </div>
  );
}

const demos = [
  { path: 'basic',            title: 'Basic — every "time" highlighted',                  Component: BasicDemo },
  { path: 'multi-state',      title: 'Multi-state — base + active + preview + bookmarked', Component: MultiStateDemo },
  { path: 'render-prop',      title: 'Render-prop — star next to the active match',        Component: RenderPropDemo },
  { path: 'headless',         title: 'Headless hook — DIY rendering',                     Component: HeadlessDemo },
  { path: 'overlap-merge',    title: 'Overlap strategy: merge',                            Component: OverlapMergeDemo },
  { path: 'overlap-nest',     title: 'Overlap strategy: nest',                             Component: OverlapNestDemo },
  { path: 'overlap-first',    title: 'Overlap strategy: first-wins',                       Component: OverlapFirstDemo },
  { path: 'regex',            title: 'RegExp search word — /\\btime\\b/i',                Component: RegexDemo },
  { path: 'case-insensitive', title: 'Case-sensitive vs case-insensitive',                 Component: CaseInsensitiveDemo },
  { path: 'selectors',        title: 'Selectors — match.one / range / many',               Component: SelectorsDemo },
];

export function App() {
  return (
    <ThemeWrapper>
      <Routes>
        {demos.map(({ path, title, Component }) => (
          <>
            <Route key={path} path={`/${path}`} element={<DemoPage title={title}><Component /></DemoPage>} />
            <Route key={`dark-${path}`} path={`/dark/${path}`} element={<DemoPage title={title}><Component /></DemoPage>} />
          </>
        ))}
        {/* default: redirect to /basic */}
        <Route path="*" element={<DemoPage title='Basic — every "time" highlighted'><BasicDemo /></DemoPage>} />
      </Routes>
    </ThemeWrapper>
  );
}
```

- [ ] **Step 2: Wrap root in BrowserRouter in `main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 3: Start dev server and verify each route manually**

```bash
cd examples/playground && pnpm dev &
sleep 3
curl -s http://localhost:5173/ | grep -c "root"
```

Expected: at least 1 (the HTML shell). Open http://localhost:5173/basic and http://localhost:5173/dark/basic in a browser to confirm light/dark themes render correctly. Kill the dev server when done.

- [ ] **Step 4: Build to confirm TypeScript and bundling pass**

```bash
cd examples/playground && pnpm build 2>&1 | tail -10
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add examples/playground/src/App.tsx examples/playground/src/main.tsx
git commit -m "feat(playground): wire React Router with light/dark URL routing"
```

---

## Task 7: Install Playwright at repo root

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Install `@playwright/test` as root devDep**

```bash
pnpm add -D -w @playwright/test
```

- [ ] **Step 2: Install Playwright browsers**

```bash
npx playwright install chromium firefox webkit
```

- [ ] **Step 3: Add scripts to root `package.json`**

Edit the `scripts` section of `/Users/ronenmars/Desktop/dev/web/one-more-highlight/package.json` to add:

```json
"test:visual":        "playwright test --config tests/visual/playwright.config.ts",
"test:visual:update": "playwright test --config tests/visual/playwright.config.ts --update-snapshots",
"test:visual:ui":     "playwright test --config tests/visual/playwright.config.ts --ui"
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @playwright/test and visual test scripts to root"
```

---

## Task 8: Write Playwright config

**Files:**
- Create: `tests/visual/playwright.config.ts`

- [ ] **Step 1: Create the config**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm --filter one-more-highlight-playground dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/visual/playwright.config.ts
git commit -m "feat(visual): add Playwright config with 3-browser cross-browser setup"
```

---

## Task 9: Write visual spec files

Each spec screenshots `[data-testid="demo"]` on the light and dark route. No test logic — just visual regression anchors.

**Files:**
- Create: `tests/visual/specs/basic.spec.ts`
- Create: `tests/visual/specs/multi-state.spec.ts`
- Create: `tests/visual/specs/overlap.spec.ts`
- Create: `tests/visual/specs/regex.spec.ts`
- Create: `tests/visual/specs/case-insensitive.spec.ts`
- Create: `tests/visual/specs/selectors.spec.ts`
- Create: `tests/visual/specs/render-prop.spec.ts`
- Create: `tests/visual/specs/headless.spec.ts`

- [ ] **Step 1: Create `basic.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('basic light', async ({ page }) => {
  await page.goto('/basic');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('basic-light.png');
});

test('basic dark', async ({ page }) => {
  await page.goto('/dark/basic');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('basic-dark.png');
});
```

- [ ] **Step 2: Create `multi-state.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('multi-state light', async ({ page }) => {
  await page.goto('/multi-state');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('multi-state-light.png');
});

test('multi-state dark', async ({ page }) => {
  await page.goto('/dark/multi-state');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('multi-state-dark.png');
});
```

- [ ] **Step 3: Create `overlap.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

for (const strategy of ['merge', 'nest', 'first'] as const) {
  const route = `overlap-${strategy === 'first' ? 'first' : strategy}`;
  test(`overlap-${strategy} light`, async ({ page }) => {
    await page.goto(`/${route}`);
    await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(`overlap-${strategy}-light.png`);
  });
  test(`overlap-${strategy} dark`, async ({ page }) => {
    await page.goto(`/dark/${route}`);
    await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot(`overlap-${strategy}-dark.png`);
  });
}
```

- [ ] **Step 4: Create `regex.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('regex light', async ({ page }) => {
  await page.goto('/regex');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('regex-light.png');
});

test('regex dark', async ({ page }) => {
  await page.goto('/dark/regex');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('regex-dark.png');
});
```

- [ ] **Step 5: Create `case-insensitive.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('case-insensitive light', async ({ page }) => {
  await page.goto('/case-insensitive');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('case-insensitive-light.png');
});

test('case-insensitive dark', async ({ page }) => {
  await page.goto('/dark/case-insensitive');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('case-insensitive-dark.png');
});
```

- [ ] **Step 6: Create `selectors.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('selectors light', async ({ page }) => {
  await page.goto('/selectors');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('selectors-light.png');
});

test('selectors dark', async ({ page }) => {
  await page.goto('/dark/selectors');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('selectors-dark.png');
});
```

- [ ] **Step 7: Create `render-prop.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('render-prop light', async ({ page }) => {
  await page.goto('/render-prop');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('render-prop-light.png');
});

test('render-prop dark', async ({ page }) => {
  await page.goto('/dark/render-prop');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('render-prop-dark.png');
});
```

- [ ] **Step 8: Create `headless.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('headless light', async ({ page }) => {
  await page.goto('/headless');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('headless-light.png');
});

test('headless dark', async ({ page }) => {
  await page.goto('/dark/headless');
  await expect(page.locator('[data-testid="demo"]')).toHaveScreenshot('headless-dark.png');
});
```

- [ ] **Step 9: Commit spec files**

```bash
git add tests/visual/specs/
git commit -m "feat(visual): add Playwright visual spec files for all 10 demos × 2 themes"
```

---

## Task 10: Generate baseline snapshots

Run with `--update-snapshots` to generate the PNG baselines for the first time. These get committed.

**Files:**
- Create: `tests/visual/snapshots/` (auto-generated PNGs)

- [ ] **Step 1: Make sure the library is built (Playwright needs the importable package)**

```bash
pnpm build
```

- [ ] **Step 2: Generate baselines**

```bash
pnpm test:visual:update 2>&1 | tail -20
```

Expected: all tests pass with "N snapshots written". If any test fails for a reason other than "missing snapshot", investigate before proceeding.

- [ ] **Step 3: Verify snapshot files exist**

```bash
find tests/visual/snapshots -name "*.png" | wc -l
```

Expected: 60 (10 demos × 2 themes × 3 browsers).

- [ ] **Step 4: Run tests without --update-snapshots to confirm they pass against baselines**

```bash
pnpm test:visual 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit baselines**

```bash
git add tests/visual/snapshots/
git commit -m "test(visual): add Playwright baseline snapshots (10 demos × 2 themes × 3 browsers)"
```

---

## Task 11: Add visual CI job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the `visual` job to `.github/workflows/ci.yml`**

Append this job after the existing `verify` job (before `release`):

```yaml
  visual:
    name: Visual Regression
    needs: [verify]
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v6

      - uses: pnpm/action-setup@v6

      - uses: actions/setup-node@v6
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build library
        run: pnpm build

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit

      - name: Run visual tests
        run: pnpm test:visual

      - name: Upload diff artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-diff
          path: tests/visual/test-results/
          retention-days: 7
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add visual regression job on macos-latest"
```

---

## Task 12: Final smoke test

- [ ] **Step 1: Run full unit test suite to confirm nothing broke**

```bash
pnpm verify 2>&1 | tail -10
```

Expected: all 53 tests pass, types clean, bundle under budget.

- [ ] **Step 2: Run visual tests one final time**

```bash
pnpm test:visual 2>&1 | tail -10
```

Expected: all pass.

- [ ] **Step 3: Update ROADMAP to reflect visual tests shipped**

In `docs/ROADMAP.md`, under the "Shipped" section, add:

```markdown
- **Playwright visual regression tests** — 10 demos × light/dark × Chromium/Firefox/WebKit on Mac; CI job on every PR and push to `main`.
```

- [ ] **Step 4: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: mark Playwright visual regression tests as shipped in roadmap"
```
