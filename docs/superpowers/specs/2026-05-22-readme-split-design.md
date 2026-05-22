# README split + visual identity — design spec

**Date:** 2026-05-22
**Branch:** `docs/split-readme`
**Status:** Approved (brainstorming)

## Goal

Shrink the GitHub README from 259 lines of mixed pitch + reference material to a focused landing page (~110–130 lines) that:

1. Sells the headline feature (multi-state styling) visually, in one animated example.
2. Carries a wordmark banner that establishes brand identity at first glance.
3. Links out to the docs site (`one-more-highlight.vercel.app`) for everything beyond the elevator pitch.

Most of the "cut" content already exists on the docs site — this is a routing exercise, not a content-migration one.

## Non-goals

- Re-writing or expanding docs-site content.
- Changing public API or behavior.
- Producing the SVG assets themselves (covered in the implementation plan).
- Re-styling the docs site or playground.

## Target README structure

The new README is composed of these sections, in order:

1. **Banner** — `docs/assets/banner-light.svg` + `docs/assets/banner-dark.svg` rendered via `<picture>` swap (`prefers-color-scheme`). Wordmark for "one-more-highlight" with palette highlights behind each word fragment. Above the H1.
2. **H1 + tagline + badges** — unchanged from current README. Badges: license, npm version, npm downloads, CI status, latest release, types, react peer.
3. **Chester dedication pull-quote** — unchanged (2 lines).
4. **Why this exists** — bullet list (TypeScript-first, multi-state styling, headless hook, tiny, modern). Unchanged from current lines 23–29.
5. **Animated demo** — `docs/assets/multi-state-demo-light.svg` + `docs/assets/multi-state-demo-dark.svg` via `<picture>`. Shows the three layered states composing in sequence. Replaces the current static `time time time time time` code+output block.
6. **Install** — single `pnpm` command + the existing one-liner about peer deps and runtime deps. Unchanged from current lines 49–55.
7. **Quick start** — ONE code example: the multi-state `<Highlight>` block (current lines 31–44). Followed by the existing one-sentence explanation ("A single match can be in multiple states at once; their classNames concatenate and their styles shallow-merge").
8. **Engines** — two lines + one link. Names both engines (`'one-more-highlight'` DOM, `'one-more-highlight/css'` CSS Custom Highlight API) and links to `engines/css-highlights` on the docs site.
9. **Browser & runtime** — one or two lines: "React 18+/19, Node 18+, modern evergreens (Chrome 112+, Firefox 140+, Safari 16.4+)" with a link to `recipes/browser-support`.
10. **Documentation** — categorized link table to docs-site sections + repo `docs/` folders (getting started, guides, API, recipes, engines, roadmap, ADRs). This also closes the deferred `readme_docs_index_idea.md` memory.
11. **Contributing** — one-line pointer to `CONTRIBUTING.md`. Unchanged.
12. **License** — one line. Unchanged.
13. **Chester closing pull-quote** — unchanged.

Estimated final size: **~110–130 lines**.

## Content removed from the README

Each removed block has a replacement that already exists on the docs site or in the repo:

| Removed from README | Replacement (already exists) |
| --- | --- |
| Component drop-in usage example | `docs/site/docs/getting-started/quick-start.md` |
| Headless hook example | `docs/site/docs/guides/headless-hook.mdx` |
| Render-prop section | `docs/site/docs/guides/render-prop.mdx` |
| Full `<Highlight>` props table | `docs/site/docs/api/highlight-props.md` |
| `useHighlight` segment-type reference | `docs/site/docs/api/use-highlight.md` + `api/types.md` |
| `HighlightState` selector forms | `docs/site/docs/api/highlight-state-selectors.md` |
| Behavior notes (overlap, indexing, dev warnings, regex defenses, a11y, SSR) | Distributed (see below) |
| Browser & runtime support table | `docs/site/docs/recipes/browser-support.md` |
| Diacritic-insensitive recipe | `docs/site/docs/recipes/diacritic-insensitive.md` |
| Engines section (full body) | `docs/site/docs/engines/css-highlights.md` |
| Roadmap details | `docs/ROADMAP.md` |

### Behavior-notes distribution

Two behavior details from the current README don't have a clear home on the docs site. They are folded into existing API pages rather than creating a new recipe:

- **Out-of-range state indices warn in dev (one-time `console.warn`)** → appended to `docs/site/docs/api/highlight-state-selectors.md` under a new short subsection.
- **Regex defenses (consumer `RegExp` is cloned, `g` flag forced on, sticky `y` flag dropped with dev warning)** → appended to `docs/site/docs/api/highlight-props.md` under the `searchWords` row's description.

These are the only two API-doc updates required by this spec.

## Asset specifications

All assets live in a new `docs/assets/` directory and are linked from the README via relative paths (works on both GitHub and the npmjs.com package page).

Two SVG variants per asset (`-light.svg`, `-dark.svg`) swapped via GitHub's `<picture>` + `prefers-color-scheme` mechanism. Single-file SVGs with embedded `@media` queries do not work — GitHub renders README SVGs as `<img>` and strips inline `<style>` from them.

### `docs/assets/banner-light.svg` + `banner-dark.svg`

- **viewBox**: `0 0 1280 320` (2:1 aspect ratio; scales well in GitHub's content column and on mobile).
- **Content**: the text "one-more-highlight" rendered in a heavy sans-serif (system stack `Inter, system-ui, sans-serif`). Each word gets a different palette highlight rect behind it:
  - `one` → `#FFF166` (yellow)
  - `more` → `#A8FF80` (green)
  - `highlight` → `#FFADD6` (pink)
- **Text color**:
  - Light variant: `#1b1b1d` (matches `--hl-text` token; AAA on all three highlight backgrounds)
  - Dark variant: `#1b1b1d` (same — highlights are light, text on highlights stays dark on dark theme; only the *non-highlighted* areas need theme-aware coloring, and there are none here)
- **Subtitle line** below: "Multi-state substring highlighting for React" in lighter weight. Light variant: `#1b1b1d`. Dark variant: `#e6e6e6`.
- **Background**: transparent.
- **File size target**: < 5 KB per variant.

### `docs/assets/multi-state-demo-light.svg` + `multi-state-demo-dark.svg`

- **viewBox**: `0 0 1280 480`.
- **Scene**: a single line of text — `"React makes React fast and React fun"` — rendered as a monospace SVG `<text>` element. Three matches of "React" at known x-positions.
- **Animation timeline** (~8s loop, SMIL `<animate>` elements):

| Time | Layer | Effect |
| --- | --- | --- |
| 0.0–1.5s | base `highlightClassName` | Yellow `#FFF166` rect fades in behind all three "React" matches |
| 1.5–3.5s | `{ name: 'active', index: 2 }` | Pink underline appears under match #2 |
| 3.5–5.5s | `{ name: 'preview', range: [0, 1] }` | Green tint rect layers behind matches 0–1 |
| 5.5–7.0s | `{ name: 'bookmarked', indices: [0, 2] }` | Dotted underline appears under matches 0 and 2 |
| 7.0–8.0s | (hold) | Final composed state held, then loop |

- **Caption strip below the animation** (static text inside the SVG): the JSX snippet that produced the scene, formatted as a code block — so the viewer connects the animation to the code.
- **Reduced motion**: include a `@media (prefers-reduced-motion: reduce)` block that snaps to the final composed state with no transitions. (The `<style>` strip caveat for GitHub `<img>` SVGs only affects color queries — `prefers-reduced-motion` is honored by the user agent before the SVG is loaded; the assets still need the rule for direct opens and embedded contexts.)
- **Text color & background**: same per-variant rule as the banner.
- **File size target**: < 20 KB per variant.

## Implementation surface

Files touched by this work:

- **Replace**: `README.md`
- **Create**: `docs/assets/banner-light.svg`, `docs/assets/banner-dark.svg`, `docs/assets/multi-state-demo-light.svg`, `docs/assets/multi-state-demo-dark.svg`
- **Append small subsections to**: `docs/site/docs/api/highlight-state-selectors.md`, `docs/site/docs/api/highlight-props.md`

No source code changes. No tests added (this is a docs-only PR — README + asset files + two doc-site appendices).

## Verify (acceptance criteria)

1. `README.md` is ≤ 130 lines (excluding the closing Chester quote).
2. README renders correctly on GitHub: banner shows above H1, animation plays inline, badges visible, no broken images.
3. README renders correctly on npmjs.com: banner + animation visible. The `<picture>` markup must use the **light variant as the default `<img src>`** (npm's package page strips `<picture>` and `<source>` elements and renders only the inner `<img>`), and the light variant must look acceptable on npm's white-ish background.
4. Both light and dark SVGs render with AAA contrast (≥ 7:1) on their respective backgrounds — measured pair-wise for text-on-highlight and text-on-page combinations.
5. Animated SVG honors `prefers-reduced-motion: reduce` when opened directly (not as a `<img>`).
6. All "Documentation" table links resolve (no 404s on the deployed docs site).
7. The two API-doc appendices render without breaking the existing pages.
8. `pnpm verify` is green (no source code changed, so this is a sanity check that nothing accidentally broke).

## Out of scope

- Animations on the docs site (this spec only adds assets that live in the README).
- Updating `CLAUDE.md`, `MEMORY.md`, or the deferred memory entries (cleanup happens after merge).
- Producing a logomark separate from the wordmark.
- Migration of the npm package page or any external badge/listing.

## Open questions

None at write time. If anything emerges during implementation, surface it before committing the assets.
