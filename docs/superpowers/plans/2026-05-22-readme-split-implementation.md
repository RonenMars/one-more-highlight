# README split + visual identity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink `README.md` from 259 lines to a focused ~110–130-line landing page with a wordmark banner above the H1, an animated multi-state demo SVG replacing the static code example, and a "Documentation" link table that routes deeper content to the existing docs site.

**Architecture:** Docs-only change. No source code modified. Four new SVG assets (light + dark variants of a banner and an animated demo) committed to `docs/assets/`, swapped via GitHub `<picture>` + `prefers-color-scheme`. Two small appendices added to existing docs-site API pages to absorb the README's "behavior notes" content. The implementation order is **assets first → README rewrite → doc-site appendix → final verification**, so that every README link reference exists by the time it's written.

**Tech Stack:** Plain SVG (SMIL `<animate>` elements for the demo animation), Markdown, GitHub-flavored `<picture>` element. No new npm dependencies. Existing project tooling: `pnpm verify` (typecheck + tests + visual + build + lint:pkg + size).

**Spec:** `docs/superpowers/specs/2026-05-22-readme-split-design.md`

---

## File structure overview

**Create:**

- `docs/assets/banner-light.svg` — wordmark, light theme variant
- `docs/assets/banner-dark.svg` — wordmark, dark theme variant
- `docs/assets/multi-state-demo-light.svg` — animated multi-state demo, light theme variant
- `docs/assets/multi-state-demo-dark.svg` — animated multi-state demo, dark theme variant

**Modify:**

- `README.md` — full rewrite to the new structure (replace existing 259 lines with ~110–130 lines).
- `docs/site/docs/api/highlight-props.md` — append note about sticky `y` flag handling on consumer `RegExp` (the only behavior-notes gap; `highlight-state-selectors.md` already has the dev-warn note on line 43).

**No source changes**, **no tests added** — this is docs-only.

---

## Task 1: Create `docs/assets/` directory and banner-light.svg

**Files:**
- Create: `docs/assets/banner-light.svg`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p docs/assets
```

- [ ] **Step 2: Write `banner-light.svg`**

Wordmark "one-more-highlight" with palette highlight rects behind each word. Light theme: dark text on transparent background, light-colored highlight rects.

Palette (from `examples/playground/src/index.css` and `docs/site/src/css/custom.css` `:root` block):
- `one` highlight: `#FFF166` (yellow)
- `more` highlight: `#A8FF80` (green)
- `highlight` highlight: `#FFADD6` (pink)
- Text color: `#1b1b1d`
- Subtitle color: `#1b1b1d`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" role="img" aria-label="one-more-highlight — Multi-state substring highlighting for React">
  <title>one-more-highlight</title>
  <desc>Wordmark for the one-more-highlight library: the words "one", "more", and "highlight" rendered with yellow, green, and pink highlight backgrounds respectively.</desc>

  <!-- Highlight rectangles behind each word. Coordinates chosen so each rect
       sits flush behind its word at the chosen font-size 96 / x-positions below.
       Rect height = font cap-height + 12px breathing room. -->
  <rect x="48"  y="100" width="240" height="96" fill="#FFF166"/>
  <rect x="304" y="100" width="280" height="96" fill="#A8FF80"/>
  <rect x="600" y="100" width="540" height="96" fill="#FFADD6"/>

  <!-- Wordmark line -->
  <text x="64" y="180"
        font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="96"
        font-weight="800"
        fill="#1b1b1d"
        xml:space="preserve">one more highlight</text>

  <!-- Subtitle line -->
  <text x="64" y="260"
        font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="32"
        font-weight="500"
        fill="#1b1b1d">Multi-state substring highlighting for React</text>
</svg>
```

- [ ] **Step 3: Verify file size and rendering**

```bash
wc -c docs/assets/banner-light.svg
```

Expected: under 5 KB (5120 bytes).

Open the file in a browser (`open docs/assets/banner-light.svg` on macOS) and verify: three highlight rects sit visibly behind the three words, text is dark and legible, no overflow outside viewBox.

If text positioning is off (highlight rects don't line up under their words), adjust the rect `x` and `width` values OR the `<text>` `x` and letter spacing. The plan's coordinates assume Inter at weight 800 is available; if rendering falls back to a system sans-serif with different metrics, alignment may need a tweak.

- [ ] **Step 4: Commit**

```bash
git add docs/assets/banner-light.svg
git commit -m "docs(assets): add wordmark banner (light variant)"
```

---

## Task 2: Create banner-dark.svg

**Files:**
- Create: `docs/assets/banner-dark.svg`

- [ ] **Step 1: Write `banner-dark.svg`**

Identical to the light variant except the subtitle color is `#e6e6e6` for legibility on dark GitHub backgrounds. The wordmark text stays `#1b1b1d` because it sits on top of light-colored highlight rects (yellow/green/pink) regardless of theme.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" role="img" aria-label="one-more-highlight — Multi-state substring highlighting for React">
  <title>one-more-highlight</title>
  <desc>Wordmark for the one-more-highlight library (dark theme variant).</desc>

  <rect x="48"  y="100" width="240" height="96" fill="#FFF166"/>
  <rect x="304" y="100" width="280" height="96" fill="#A8FF80"/>
  <rect x="600" y="100" width="540" height="96" fill="#FFADD6"/>

  <text x="64" y="180"
        font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="96"
        font-weight="800"
        fill="#1b1b1d"
        xml:space="preserve">one more highlight</text>

  <text x="64" y="260"
        font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="32"
        font-weight="500"
        fill="#e6e6e6">Multi-state substring highlighting for React</text>
</svg>
```

- [ ] **Step 2: Verify file size and rendering**

```bash
wc -c docs/assets/banner-dark.svg
```

Expected: under 5 KB.

Open in a browser, then mentally check against a dark background (or wrap the `<img>` test container in a `background: #0d1117` div — GitHub's dark-mode background). Subtitle must be legible.

- [ ] **Step 3: Commit**

```bash
git add docs/assets/banner-dark.svg
git commit -m "docs(assets): add wordmark banner (dark variant)"
```

---

## Task 3: Create multi-state-demo-light.svg

**Files:**
- Create: `docs/assets/multi-state-demo-light.svg`

- [ ] **Step 1: Write `multi-state-demo-light.svg`**

An animated SVG using SMIL (`<animate>` elements). The animation cycles through the four layered states described in the spec timeline, then loops.

Scene text: `"React makes React fast and React fun"`. Three matches of "React" at known x-positions in a monospace font (each char ~24px wide at font-size 40).

Approximate "React" positions in monospace (5 chars × 24px = 120px wide per match):
- Match 0 (`React`): x=48 to x=168
- "makes" (5 chars + 2 spaces = 168px)
- Match 1 (`React`): x=336 to x=456
- "fast and" (8 chars + 2 spaces = 240px)
- Match 2 (`React`): x=696 to x=816
- "fun" trailing

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 480" role="img" aria-label="Animated demo: multi-state substring highlighting layered over three matches of the word React">
  <title>one-more-highlight multi-state demo</title>
  <desc>Animation showing four highlight layers composing in sequence over three matches of the word React: a yellow base on all matches, a pink underline on match 2, a green tint on matches 0-1, and a dotted underline on matches 0 and 2.</desc>

  <!-- Layer 1: yellow base behind all three matches (0.0-1.5s fade-in) -->
  <g opacity="0">
    <rect x="48"  y="172" width="120" height="56" fill="#FFF166"/>
    <rect x="336" y="172" width="120" height="56" fill="#FFF166"/>
    <rect x="696" y="172" width="120" height="56" fill="#FFF166"/>
    <animate attributeName="opacity" values="0;1;1;1;1" keyTimes="0;0.1875;0.875;0.9375;1" dur="8s" repeatCount="indefinite"/>
  </g>

  <!-- Layer 2: green tint on matches 0-1 (3.5-5.5s fade-in) -->
  <g opacity="0">
    <rect x="48"  y="172" width="120" height="56" fill="#A8FF80" fill-opacity="0.55"/>
    <rect x="336" y="172" width="120" height="56" fill="#A8FF80" fill-opacity="0.55"/>
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.4375;0.6875;1" dur="8s" repeatCount="indefinite"/>
  </g>

  <!-- Layer 3: pink underline on match 2 (1.5-3.5s fade-in) -->
  <g opacity="0">
    <rect x="696" y="232" width="120" height="6" fill="#FFADD6"/>
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.1875;0.4375;1" dur="8s" repeatCount="indefinite"/>
  </g>

  <!-- Layer 4: dotted underline on matches 0 and 2 (5.5-7.0s fade-in) -->
  <g opacity="0">
    <line x1="48"  y1="240" x2="168" y2="240" stroke="#1b1b1d" stroke-width="3" stroke-dasharray="6 4"/>
    <line x1="696" y1="240" x2="816" y2="240" stroke="#1b1b1d" stroke-width="3" stroke-dasharray="6 4"/>
    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.6875;0.875;1" dur="8s" repeatCount="indefinite"/>
  </g>

  <!-- Scene text -->
  <text x="48" y="216"
        font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="40"
        font-weight="500"
        fill="#1b1b1d"
        xml:space="preserve">React makes React fast and React fun</text>

  <!-- Caption: the JSX that produced this scene -->
  <text x="48" y="340"
        font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="22"
        fill="#1b1b1d"
        xml:space="preserve">&lt;Highlight</text>
  <text x="48" y="368"
        font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="22"
        fill="#1b1b1d"
        xml:space="preserve">  text="React makes React fast and React fun"</text>
  <text x="48" y="396"
        font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="22"
        fill="#1b1b1d"
        xml:space="preserve">  searchWords={['React']}</text>
  <text x="48" y="424"
        font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="22"
        fill="#1b1b1d"
        xml:space="preserve">  highlightClassName="bg-yellow"</text>
  <text x="48" y="452"
        font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="22"
        fill="#1b1b1d"
        xml:space="preserve">  states={[{ name: 'active', index: 2 }, ... ]} /&gt;</text>
</svg>
```

- [ ] **Step 2: Verify file size**

```bash
wc -c docs/assets/multi-state-demo-light.svg
```

Expected: under 20 KB (20480 bytes). Current draft is well under.

- [ ] **Step 3: Verify animation behavior**

Open `docs/assets/multi-state-demo-light.svg` in a browser. Verify:
- Animation runs (yellow rects fade in at start, pink underline at ~1.5s, green tint at ~3.5s, dotted lines at ~5.5s, then loops).
- "React" words sit visually inside the yellow rects (not floating above/below).
- If alignment is off, adjust the rect `x` values OR the text `x` and letter spacing. Monospace metrics vary slightly across system fonts.

- [ ] **Step 4: Verify `prefers-reduced-motion` honored on direct open**

The SMIL `<animate>` elements run regardless of the OS reduced-motion preference (this is a known SMIL limitation). To honor the spec's reduced-motion requirement, **add a static fallback group at the end of the SVG that renders the final composed state and is shown only under reduced motion**:

Add inside the `<svg>` before `</svg>`:

```xml
  <!-- Reduced-motion fallback: render final composed state statically.
       The <style> block below is only honored when the SVG is opened directly
       in a browser (not as an <img> in markdown). Adequate for direct opens. -->
  <style>
    @media (prefers-reduced-motion: reduce) {
      g { opacity: 1 !important; }
      g animate { display: none; }
    }
  </style>
```

Then re-verify in a browser with reduced motion enabled (System Settings → Accessibility → Display → Reduce motion on macOS): all four layers should appear at full opacity from t=0, no fade animation.

- [ ] **Step 5: Commit**

```bash
git add docs/assets/multi-state-demo-light.svg
git commit -m "docs(assets): add animated multi-state demo (light variant)"
```

---

## Task 4: Create multi-state-demo-dark.svg

**Files:**
- Create: `docs/assets/multi-state-demo-dark.svg`

- [ ] **Step 1: Write `multi-state-demo-dark.svg`**

Identical to the light variant except for text colors: the **scene text** stays `#1b1b1d` (it sits on yellow/green highlight rects), but the **caption text** below uses `#e6e6e6` for legibility on dark backgrounds. The **dotted-underline stroke** (Layer 4) also flips to `#e6e6e6` because it sits outside the highlight rects.

Copy the light variant verbatim, then apply these three changes:

1. Layer 4 `<line>` elements: change `stroke="#1b1b1d"` to `stroke="#e6e6e6"`.
2. All five caption `<text>` elements (the JSX block, y=340 through y=452): change `fill="#1b1b1d"` to `fill="#e6e6e6"`.
3. Keep the scene text `<text>` (y=216) at `fill="#1b1b1d"` — it sits on the yellow rect.

Reduced-motion `<style>` block stays as-is.

- [ ] **Step 2: Verify file size and rendering**

```bash
wc -c docs/assets/multi-state-demo-dark.svg
```

Expected: under 20 KB.

Visually check on a dark background. Caption JSX must be legible. Dotted underlines must be visible against the dark page background (not just against the highlight rects).

- [ ] **Step 3: Commit**

```bash
git add docs/assets/multi-state-demo-dark.svg
git commit -m "docs(assets): add animated multi-state demo (dark variant)"
```

---

## Task 5: Append regex-defense behavior note to highlight-props.md

**Files:**
- Modify: `docs/site/docs/api/highlight-props.md`

**Context**: `highlight-props.md:16` already mentions *"RegExps are cloned with `g` flag forced on"* in the `searchWords` row. The gap is the sticky `y` flag handling (dropped with dev warning). The `highlight-state-selectors.md:43` already has the dev-warn-on-out-of-range note — no change needed there.

- [ ] **Step 1: Read the file**

Read `docs/site/docs/api/highlight-props.md` (already partially shown — full file is short, ~57 lines).

- [ ] **Step 2: Append a "Regex defenses" subsection at the end of the file**

After line 56 (the `forwardRef` paragraph), append:

```markdown

## Regex defenses

When you pass a `RegExp` instance in `searchWords`, `<Highlight>` does three things to avoid common footguns:

- **Clones the regex** so the consumer-supplied object's `lastIndex` is never mutated (regex objects carry stateful `lastIndex` when used with `g` or `y` flags).
- **Forces the `g` flag on** in the clone so `matchAll` walks the full string.
- **Drops the sticky `y` flag** from the clone, because anchored sticky matching is incompatible with this component's "find all occurrences" semantics. A one-time `console.warn` fires in development (`NODE_ENV !== 'production'`) when a sticky regex is passed.

The original regex you passed in is never modified.
```

- [ ] **Step 3: Verify the docs site still builds**

```bash
pnpm --filter docs-site run typecheck 2>/dev/null || (cd docs/site && pnpm typecheck)
```

If the docs site uses a different verify step, run `pnpm verify` from repo root. Expected: no errors. (This is a markdown-only change; the typecheck mostly verifies imports in MDX files, not raw markdown.)

- [ ] **Step 4: Commit**

```bash
git add docs/site/docs/api/highlight-props.md
git commit -m "docs(site): document regex defenses on searchWords prop"
```

---

## Task 6: Rewrite README.md

**Files:**
- Modify: `README.md`

This is the largest single change in the plan. The new README is written end-to-end as a complete file replacement.

- [ ] **Step 1: Confirm the existing README is in clean state**

```bash
git status README.md
```

Expected: no uncommitted changes.

- [ ] **Step 2: Replace the README**

Replace the entire contents of `README.md` with the following:

````markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/banner-dark.svg">
  <img src="./docs/assets/banner-light.svg" alt="one-more-highlight — Multi-state substring highlighting for React" width="100%">
</picture>

# omh · one-more-highlight

> Multi-state substring highlighting for React.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/one-more-highlight.svg)](https://www.npmjs.com/package/one-more-highlight)
[![npm downloads](https://img.shields.io/npm/dm/one-more-highlight.svg)](https://www.npmjs.com/package/one-more-highlight)
[![CI](https://img.shields.io/github/actions/workflow/status/ronenmars/one-more-highlight/ci.yml?branch=main&label=CI)](https://github.com/ronenmars/one-more-highlight/actions)
[![Latest release](https://img.shields.io/github/v/release/ronenmars/one-more-highlight?label=release)](https://github.com/ronenmars/one-more-highlight/releases/latest)
[![types](https://img.shields.io/npm/types/one-more-highlight.svg)](https://www.npmjs.com/package/one-more-highlight)
[![React](https://img.shields.io/npm/dependency-version/one-more-highlight/peer/react?label=react)](https://www.npmjs.com/package/one-more-highlight?activeTab=dependencies)

> *Dedicated to Chester Bennington. Inspired by the idea that every small light matters.*
>
> — *"I tried so hard and got so far…"* — we built this so the right words could shine.

---

## Why this exists

**`one-more-highlight`** gives you:

- **TypeScript-first** — full types and a discriminated-union `HighlightState` that narrows correctly on the selector field (`index`, `range`, or `indices`).
- **Multi-state styling** as the headline feature — every match gets a base style, plus layered styles selected by index, range, or arbitrary list. Styles compose.
- **Headless `useHighlight` hook** alongside the `<Highlight>` component, with a `renderMatch` render-prop for full per-match control.
- **Tiny** — ~2 KB brotlied (ESM), 2 microscopic deps (`clsx` + `escape-string-regexp`).
- **Modern** — React 18+/19, ESM + CJS dual build with `.d.ts` + `.d.cts`, tree-shakeable, SSR-safe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/multi-state-demo-dark.svg">
  <img src="./docs/assets/multi-state-demo-light.svg" alt="Animated demo: yellow base highlight on all React matches, then pink underline on match 2, then green tint on matches 0-1, then dotted underline on matches 0 and 2." width="100%">
</picture>

## Install

```bash
pnpm add one-more-highlight
# or: npm i one-more-highlight / yarn add one-more-highlight
```

Peer: `react >= 18`. Runtime deps: `clsx`, `escape-string-regexp` (both MIT, ~400 B combined).

## Quick start

```tsx
import { Highlight } from 'one-more-highlight';

<Highlight
  text="time time time time time"
  searchWords={['time']}
  highlightClassName="bg-yellow-200"
  states={[
    { name: 'active',     index: 2,         className: 'bg-orange-500 ring-2' },
    { name: 'preview',    range: [0, 1],    className: 'bg-blue-100' },
    { name: 'bookmarked', indices: [3, 4],  className: 'underline' },
  ]}
/>
```

A single match can be in multiple states at once; their `className`s concatenate and their `style`s shallow-merge in declaration order.

## Engines

`one-more-highlight` ships two rendering engines that share the same matching pipeline. The default `<Highlight>` from `'one-more-highlight'` wraps each match in a DOM node; `<CssHighlight>` from `'one-more-highlight/css'` paints via the CSS Custom Highlight API with zero per-match DOM nodes (faster on long text).

See [engines/css-highlights](https://one-more-highlight.vercel.app/docs/engines/css-highlights).

## Browser & runtime

React 18+/19, Node 18+, modern evergreens (Chrome 112+, Firefox 140+, Safari 16.4+). Full matrix → [recipes/browser-support](https://one-more-highlight.vercel.app/docs/recipes/browser-support).

## Documentation

| Topic | Where |
| --- | --- |
| Getting started — install, intro, quick start | [docs site → getting-started](https://one-more-highlight.vercel.app/docs/getting-started/intro) |
| Guides — basic highlighting, headless hook, multi-state styling, render-prop | [docs site → guides](https://one-more-highlight.vercel.app/docs/guides/basic-highlighting) |
| API reference — `<Highlight>` props, `useHighlight`, types, `HighlightState` selectors | [docs site → api](https://one-more-highlight.vercel.app/docs/api/highlight-props) |
| Recipes — accessibility, diacritic-insensitive search, overlap strategies, browser support | [docs site → recipes](https://one-more-highlight.vercel.app/docs/recipes/accessibility) |
| Engines — CSS Custom Highlight API | [docs site → engines](https://one-more-highlight.vercel.app/docs/engines/css-highlights) |
| Roadmap (v2+ plan) | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| Architecture decisions | [`docs/adr/`](./docs/adr/) |

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Bug reports and edge-case fuzz cases especially welcome.

## License

MIT © Ronen Mars. See [`LICENSE`](./LICENSE).

---

> *"In the end, it doesn't even matter"* — except when it does.
> Every match. Every word. Every voice that mattered.
> R.I.P. Chester. 🤍
````

- [ ] **Step 3: Verify line count**

```bash
wc -l README.md
```

Expected: between 95 and 130 lines (the file above is approximately 100 lines including blanks).

- [ ] **Step 4: Verify the README renders correctly locally**

Open `README.md` in a markdown previewer (VS Code: ⌘⇧V; GitHub-style renderer ideal but any will do for a sanity check).

Check:
- Banner image renders at the top.
- All badge images render.
- The animated demo image renders below "Why this exists".
- The "Documentation" link table renders correctly with all 7 rows.
- No broken-image icons anywhere.

- [ ] **Step 5: Verify all links resolve**

```bash
# Check repo-relative links exist
ls -1 LICENSE docs/ROADMAP.md docs/adr/ CONTRIBUTING.md docs/assets/banner-light.svg docs/assets/banner-dark.svg docs/assets/multi-state-demo-light.svg docs/assets/multi-state-demo-dark.svg
```

Expected: all paths exist (no "No such file or directory" errors).

For the docs-site URLs (`https://one-more-highlight.vercel.app/docs/...`), confirm with a `curl -sI` on each unique base path:

```bash
for path in /docs/getting-started/intro /docs/guides/basic-highlighting /docs/api/highlight-props /docs/recipes/accessibility /docs/engines/css-highlights; do
  echo -n "$path -> "
  curl -sI "https://one-more-highlight.vercel.app$path" | head -n 1
done
```

Expected: every line shows `HTTP/2 200` (or `HTTP/1.1 200 OK`). If any return `404`, fix the link in the README before committing.

- [ ] **Step 6: Run full project verification**

```bash
pnpm verify
```

Expected: all green. This is a docs-only change so nothing should break; running `verify` confirms that no incidental file got touched (e.g. by an editor's auto-formatter on save).

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README as landing page with banner and animated demo"
```

---

## Task 7: Final verification across the full change set

**Files:** None (verification only)

- [ ] **Step 1: Confirm git log shape**

```bash
git log --oneline origin/main..HEAD
```

Expected: 7 commits on `docs/split-readme`, in this order:
1. `docs(superpowers): add README split + visual identity design spec` (from the brainstorming step — already on the branch)
2. `docs(assets): add wordmark banner (light variant)`
3. `docs(assets): add wordmark banner (dark variant)`
4. `docs(assets): add animated multi-state demo (light variant)`
5. `docs(assets): add animated multi-state demo (dark variant)`
6. `docs(site): document regex defenses on searchWords prop`
7. `docs: rewrite README as landing page with banner and animated demo`

If any commit is missing or out of order, investigate before pushing.

- [ ] **Step 2: Verify acceptance criteria from the spec**

Walk the spec's "Verify" section (`docs/superpowers/specs/2026-05-22-readme-split-design.md` lines 88–95) and confirm each:

1. `wc -l README.md` ≤ 130 lines ✓
2. Banner + animation render at top (visual check from Step 4 of Task 6) ✓
3. `<img src>` in `<picture>` is the light variant ✓ (verify with `grep 'srcset\|src=' README.md` — light should be the bare `<img src=>`, dark should be the `<source srcset>`)
4. AAA contrast: text/highlight pairs already verified at palette level (see `docs/site/src/css/custom.css` header comments). No re-measurement needed since we're using the same tokens.
5. Reduced-motion behavior (Task 3 Step 4 verified this) ✓
6. Documentation table links resolve (Task 6 Step 5 verified this) ✓
7. API doc appendix renders (Task 5 Step 3 verified this) ✓
8. `pnpm verify` green (Task 6 Step 6 verified this) ✓

- [ ] **Step 3: Push the branch**

Per repo policy, do **not** push without explicit user approval. Ask:

> "All tasks complete and verified. Ready to push `docs/split-readme` to origin and open a PR? (Will not auto-push without your go-ahead.)"

If the user approves, then:

```bash
git push -u origin docs/split-readme
```

- [ ] **Step 4: Update memory (after merge)**

After the PR merges to `main`, update the `readme_docs_index_idea.md` memory entry to mark it implemented. This is a post-merge action — do **not** modify memory during this plan's execution.

---

## Self-review notes

**Spec coverage check:**
- Banner light + dark — Tasks 1, 2 ✓
- Animated demo light + dark — Tasks 3, 4 ✓
- README rewrite to ~110–130 lines — Task 6 ✓
- Behavior-notes distribution: dev-warn on out-of-range — already in `highlight-state-selectors.md:43`, no task needed ✓
- Behavior-notes distribution: regex defenses — Task 5 ✓
- `<picture>` light-as-default for npm fallback — Task 6 Step 2 `<img src>` uses light ✓
- All 8 acceptance criteria — Task 7 Step 2 ✓

**Placeholder scan:** No TBDs, no TODOs. Every code block is complete. Every command shows expected output. No "similar to Task N" references.

**Type/path consistency:**
- Asset paths: `docs/assets/banner-light.svg`, `banner-dark.svg`, `multi-state-demo-light.svg`, `multi-state-demo-dark.svg` — used identically across Tasks 1–6 ✓
- Palette: `#FFF166 / #A8FF80 / #FFADD6 / #1b1b1d / #e6e6e6` — used identically across Tasks 1–4 ✓
- Docs-site URL base `https://one-more-highlight.vercel.app/docs/...` — used identically in Tasks 6 README and Task 7 verification ✓

No gaps found.
