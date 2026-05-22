# Roadmap — `one-more-highlight`

> *Statement of intent: where we are, where we're going, and why.*

## Project mission

Build the React text-highlighting library that staff engineers actually want to use in 2026 and beyond:

- **TypeScript-first**, with discriminated-union selectors that narrow correctly.
- **Multi-state per-match styling** as the headline feature — not bolted on.
- **Headless-friendly** (`useHighlight` hook) for design-system / Tailwind / CSS-in-JS consumers.
- **Tiny** (~2 KB brotlied) and **dependency-light** (2 micro-deps).
- **Modern** — React 18+/19, ESM-first, SSR-safe, tree-shakeable.

We are not trying to replace `react-highlight-words` for everyone — we are trying to be the obvious choice for anyone who needs typed multi-state highlighting on a modern stack.

## Where we are — v0.4 (2026-05)

### Shipped

- `<Highlight>` component with `searchWords`, base/state styling, `renderMatch` render-prop, accessibility role fallback.
- `useHighlight` hook returning `{ segments, getMatchCount }` for headless rendering.
- Three `HighlightState` selector forms — `{ index }`, `{ range }`, `{ indices }`.
- Three overlap strategies: `merge` (default), `nest`, `first-wins`.
- Native-first `RegExp.escape()` with `escape-string-regexp` fallback.
- ESM + CJS dual build, `.d.ts` + `.d.cts`, `exports` map, `sideEffects: false`.
- 77 tests across 11 suites, including 1000-iteration property-based fuzz.
- 1.89 KB ESM / 2.23 KB CJS brotlied for the default entry. Zero CSS shipped.
- **Docusaurus docs site** deployed at [one-more-highlight.vercel.app](https://one-more-highlight.vercel.app) — Getting Started, Guides, API, Recipes, Playground sections; dark mode default; live inline demos.
- **CI pipeline** (GitHub Actions) — `pnpm verify` on every push; semantic-release auto-publishes on `fix:`/`feat:` commits to `main`.
- **Interactive playground** — StackBlitz-backed editor linked from docs; inline Monaco editor demos on guide pages.
- **Playwright visual regression tests** — 10 demos × light/dark across 5 projects (desktop Chromium/Firefox/WebKit at 2× DPR + mobile-iphone + mobile-android); CI job on every PR and push to `main`.
- Per-search-term match selectors — `{ term }` and `{ term, nth }` on `HighlightState`, with `termMatch: 'all' | 'first'` and `silent` modifiers.

### Verified

- `pnpm typecheck` ✅ strict, no any
- `pnpm test` ✅ 52/52
- `pnpm build` ✅ tsup ESM+CJS+types
- `pnpm lint:pkg` ✅ publint + attw all green
- `pnpm size` ✅ under 3 KB brotlied budget

## Near-term (v0.3 — v0.4)

### v0.3 — Quality of life (in progress)

- [x] **Live docs site** — deployed to Vercel with interactive demos.
- [x] **CI pipeline** — GitHub Actions + semantic-release on `main`.
- [x] **Browser support matrix** documented in README — explicitly state Node 18+ for `escape-string-regexp` ESM, modern evergreen browsers for native `RegExp.escape`.
- [x] **Diacritic-insensitive search recipe** in README — show `sanitize: (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '')`.

### v0.4 — Robustness polish

- [x] **Strict mode dev warnings** — log a one-time warning when:
  - The same `RegExp` identity changes between renders (likely an inline `new RegExp(...)`).
  - A consumer passes a sticky `/foo/y` regex.
  - `states` references match indices beyond the actual match count.
- [x] **`getMatchCount()` helper** exported from `useHighlight` results so consumers can validate `states` config before passing it.
- [x] **`forwardRef` support** on `<Highlight>` — open issue on `react-highlight-words` (#127) suggests demand.

## Mid-term (v1.0)

Earning the major version. Stability commitment + a feature that meaningfully differentiates us from `react-highlight-words`.

### v1.0 candidates

- [x] **Per-search-term match indexing** — shipped. Selector forms `{ name, term }` and `{ name, term, nth }` on `HighlightState`. See `docs/site/docs/api/highlight-state-selectors.md`.
- [ ] **Stable match IDs** — `{ name, matchId: 'msg-42-occurrence-3' }` for references that survive data changes.
- [ ] **`getMatchByIndex(i)` and `getMatchAt(charPos)`** helpers for keyboard navigation patterns ("press ↓ for next match").
- [ ] **Public API freeze** — every exported type and prop is committed to with semver guarantees.

## Long-term (v2.x)

Bigger investments. Each is its own design conversation.

### v2.0 — CSS Custom Highlight API engine ✅ shipped

Opt-in `one-more-highlight/css` sub-export. Range-based, no DOM mutation, ~10× perf on long text. Author writes `::highlight(name) { … }` and controls priority via `highlight-order`. See ADR-0002 for the decision record and `docs/site/docs/engines/css-highlights.md` for the consumer docs.

**Deferred:** unifying `<Highlight>` and `<CssHighlight>` under a single component with a discriminated-union `engine` prop. The sub-export keeps the option open — collapse later once usage tells us which shape is right.

### v2.x — Match modes

- **Grapheme-aware matching** via `Intl.Segmenter` (opt-in `granularity: 'codeunit' | 'grapheme'`). Solves diacritic and emoji-ZWJ-sequence edge cases.
- **Fuzzy matching** with configurable Levenshtein distance (opt-in `matchMode: 'exact' | 'fuzzy'`). Likely a separate sub-export to avoid bloating the default bundle.

### v2.x — Drop legacy deps

When Node 22 LTS reaches end-of-life (~April 2027) and `RegExp.escape()` is universally available, drop `escape-string-regexp`. The `src/escapeRegex.ts` adapter localizes the change — no public API impact. Same goes for re-evaluating `clsx` if React or browser standards add a built-in `class` joiner.

### v2.x — RTL language support (Hebrew, Arabic, etc.)

Substring matching is direction-agnostic — character offsets work the same in LTR and RTL text — but the visual rendering of highlights inside bidirectional content has edge cases worth documenting and demoing:

- **Mixed-direction matches:** a match that spans LTR and RTL runs (e.g., searching for a number inside Hebrew prose) renders as multiple visual segments per the Unicode BiDi algorithm, even though it is one logical match.
- **Neutral characters at match boundaries:** spaces, punctuation, and digits adjacent to RTL text inherit direction context. A highlight on the boundary may visually attach to the wrong run.
- **Match index ordering in UI:** "next match" / "previous match" navigation needs to follow logical order, not visual order, to feel right in RTL UIs.
- **`<mark>` direction inheritance:** the DOM engine's `<mark>` correctly inherits `dir` from its container. Verify the CSS engine's `::highlight()` painting respects the same direction.

**Deliverables:**
- Recipe page `docs/site/docs/recipes/rtl-languages.md` covering the BiDi gotchas with worked examples.
- Two playground demos: one Hebrew, one Arabic, both with realistic mixed-direction text and multi-state highlights.
- Visual snapshots for both demos across the 5-project matrix.
- README mention under "Engines" or "Features" — RTL support is currently invisible to consumers searching for it.

No library code changes expected — this is documentation + demos that validate (and pin) the existing behavior. If a real BiDi rendering bug surfaces, that becomes a separate fix.

### v2.x — Typed regex helper (investigate)

Expose a public helper that takes user-authored regex strings and returns a typed RegExp with compile-time validation: pattern syntax errors caught at the type level, named capture groups inferred into the exec() return shape, and typos in group references rejected before runtime. Likely a thin wrapper around [`@ark/regex`](https://www.npmjs.com/package/@ark/regex) (a drop-in replacement for `new RegExp()` with full type inference) re-exported under our own surface so the dependency stays swappable.

**Open questions to resolve before shipping:**
- Does the type-inference win pay for the runtime dep? `@ark/regex` is currently 0.0.5 — we would want stability or to vendor the type-only bits.
- Where does the helper belong? Default entry, or a `one-more-highlight/regex` sub-export so consumers using only string `searchWords` pay nothing?
- Does it compose cleanly with `findChunks` consumers who already author their own matchers?

Defer until at least one consumer asks for typed capture-group access in `searchWords`. Today's RegExp literal support already works; this is an ergonomics layer, not a missing feature.

## Explicitly out of scope

These are good ideas, but they belong in *other* libraries — not this one. Don't propose them.

- **Full-text search** (TF-IDF, BM25, indexing) — use Lucene-style libs.
- **Syntax highlighting** for code — use Prism, Shiki, or Highlight.js.
- **HTML/Markdown content highlighting** with structural awareness — needs a different model.
- **Highlighting in `contentEditable`** elements — different rendering contract; consider `highlight-search-term`.
- **Server-side highlighting in non-React contexts** — extract `findMatches`/`combineChunks` into a framework-agnostic core if we need this. Not before.

## How we make decisions

When a feature request arrives:

1. **Does it fit the mission?** Multi-state, typed, tiny. If it fights one of those, no.
2. **Does it earn its bytes?** Every kilobyte is paid for by every consumer forever.
3. **Is there an existing escape hatch?** `findChunks`, `sanitize`, and `renderMatch` cover a *lot* of customization without API additions.
4. **Is there demand?** A real bug report or PR beats a "what if."
5. **Can it ship as a separate package or sub-export?** Bigger features (fuzzy matching, CSS Highlights engine) may live in `one-more-highlight/fuzzy` or `one-more-highlight/css-highlights` rather than the default bundle.

## Versioning

[Semantic Versioning](https://semver.org/) starting from `1.0.0`.

- **Patch**: bug fixes, internal refactors, doc updates, dependency bumps that don't change behavior.
- **Minor**: additive features — new props, new selector forms — that don't break existing usage.
- **Major**: any breaking change to the public API surface (props, hook signatures, returned types).

Pre-1.0 (current): minor bumps may be breaking. Read the changelog.

## License

MIT © Ronen Mars

---

> *"What I've done"* — and what's left to do.
