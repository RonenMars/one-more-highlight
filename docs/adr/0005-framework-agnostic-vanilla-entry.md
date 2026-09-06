# ADR-0005 — Ship the framework-agnostic engine as a `/vanilla` sub-export

- **Status:** Accepted
- **Date:** 2026-09-06
- **Decider:** Ronen Mars

## Context

`docs/ROADMAP.md` listed "server-side highlighting in non-React contexts" as out
of scope, with a standing note: *extract `findMatches`/`combineChunks` into a
framework-agnostic core if we need this. Not before.* Market research in
September 2026 supplied the "if":

- `mark.js` — the incumbent framework-agnostic highlighter — draws **12.6M npm
  downloads/month** on a package whose last release was **January 2018** and
  whose repository has **issues disabled**. Its designated successor,
  `advanced-mark.js`, has captured roughly 0.6% of that traffic in eight years.
- The CSS Custom Highlight API reached **Baseline widely-available in March
  2026**, and a wave of contenders launched behind it — `highbeam`
  (2026-08-17), `term-highlight` (2026-08-22), `react-css-highlight`. Every one
  is under 2k downloads/month. The field is unconsolidated.
- By contrast the Vue ecosystem totals ~226k/month across three libraries with a
  maintained incumbent, and Angular totals ~1.8k/month. Neither is worth a port.

Separately, the core was *already* framework-agnostic at runtime: `findMatches`,
`combineChunks`, `applyStates`, `buildSegments`, `fromRanges` and `escapeRegex`
import no React values and touch no DOM. Only the assembly point
(`useHighlight`) and the renderers were React-bound.

## Decision

Ship `one-more-highlight/vanilla` as a sub-export of this package — not as a
second npm package. It exposes the headless `highlight()` composition, a
`TextIndex` DOM walker, and a `Highlighter` class that paints via the CSS Custom
Highlight API with a `<mark>`-injection fallback. Add an IIFE build
(`dist/omh.global.js`, global `OMH`) so a plain HTML page can use it with no
bundler. Make `react` an optional peer dependency.

## Why

1. **The infrastructure is built for sub-exports.** Four already exist (`/css`,
   `/native`, `/a11y`, `/navigation`). A fifth cost four mechanical config edits:
   one `tsup` entry, one `exports` block, one `typesVersions` line, and
   `size-limit` budgets.
2. **A second package would mean rebuilding the release pipeline.**
   `.releaserc.json` is single-package by construction — `@semantic-release/npm`
   with no `pkgRoot`, a flat `v${version}` tag namespace, a hardcoded
   `git.assets` list, and `scripts/sync-playground-version.mjs` pinning one
   version. Two packages need a prefixed tag namespace and either two release
   runs or a changesets migration.
3. **The one real argument for splitting was cheap to neutralize.** A vanilla
   consumer previously got an unmet-peer warning because `react` was a required
   peer. Moving it to `peerDependenciesMeta.optional` — which the file already
   did for `react-native` — removes it in three lines.
4. **The package name carries no React baggage.** `one-more-highlight` describes
   the capability, not the framework, so one listing can serve both audiences
   once the description, keywords and README stop saying "for React".
5. **The differentiator survives the port intact.** The multi-state model maps
   onto `CSS.highlights` one-to-one: each state becomes a named highlight
   addressable as `::highlight(<name>)`. No competitor in the new cohort ships
   per-occurrence selectors.

## Consequences

- **Additive only.** No existing export, prop or type changed behavior. Semver
  minor.
- **New public surface:** `Highlighter`, `highlight()`, `TextIndex`,
  `supported()`, plus vanilla-flavored `HighlightState*` types that drop the DOM
  `style` field (the `css` renderer styles by name in CSS; the `mark` renderer
  uses `className`).
- **New files:** `src/vanilla/{index,core,types,walk,Highlighter}.ts`,
  `src/vanilla/renderers/{css,mark}.ts`, `tests/vanilla/*`,
  `examples/vanilla/index.html`, `docs/site/docs/engines/vanilla.md`.
- **`tsup.config.ts` became a two-config array** — the second builds the IIFE
  bundle with `process.env.NODE_ENV` substituted, since the dev-warning guards in
  `findMatches`/`applyStates` would otherwise reference a Node global in a
  browser.
- **Known limitation, accepted:** the emitted `dist/vanilla/index.d.ts` carries a
  bare `import 'react'` inherited from the shared type chunk. Verified inert
  against a project with no React types and `skipLibCheck: true` (TypeScript's
  own default); it surfaces only under `skipLibCheck: false`. Removing it means
  splitting the React-flavored types out of `src/types.ts`, which is not worth
  the churn without a real report.
- **Cross-element matching is new behavior with no React-side equivalent.** The
  `<Highlight>` component renders its own flat text node; `TextIndex` walks a
  subtree it does not own. The two will not stay in lockstep, and that is fine.

## Alternatives considered

### A second npm package (`omh-core` or similar) in a `packages/` directory

**Rejected** because: the only benefit is npm discoverability for the mark.js
audience, and that is bought far more cheaply by fixing this package's
description, keywords and README. The cost is a rebuilt release pipeline, a
split tag namespace, a forked `verify`/`size`/`lint:pkg` chain, and permanent
version-skew risk between core and the React entry. Revisit only if `/vanilla`
outgrows the React entry.

### Headless core only — export the pure functions, let consumers paint

**Rejected** because: it would not be competitive. `highbeam` and
`term-highlight` both ship the painting, and a plain-HTML user who still has to
write `TreeWalker` and `Range` code by hand has not been given a library. The
painting is also the part where this package's multi-state model becomes
visible.

### String-only input, no DOM subtree walking

**Rejected** because: matching across element boundaries is the single most
common thing mark.js users do, and without it the entry is not a credible
alternative for that audience. The walker is genuinely the risky 20% — it is
covered by 13 dedicated unit tests plus real-browser verification.

### CSS renderer only, no `<mark>` fallback

**Rejected** because: the API is Baseline but not universal, and embedded
webviews lag. The fallback is ~60 lines sharing the same `TextIndex`, and it
keeps `strategy: 'auto'` honest.

## Do not re-propose

Do not re-propose splitting this into a second npm package because "the vanilla
build should not ship React code". It does not — `/vanilla` imports no React
values, and tree-shaking plus separate entry files mean a vanilla consumer never
loads the React entry. The `.d.ts` `import 'react'` noted above is a type-layer
artifact with a known, cheaper fix (splitting `src/types.ts`), not a reason to
split the package.
