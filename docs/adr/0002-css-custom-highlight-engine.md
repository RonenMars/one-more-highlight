# ADR-0002 — Ship the CSS Custom Highlight API engine as a `/css` sub-export

- **Status:** Accepted
- **Date:** 2026-05-17
- **Decider:** Ronen Mars

## Context

`<Highlight>` (the default engine) wraps each match in a `<mark>` DOM
node. For long text — tens of KB, thousands of matches — that per-match
DOM mutation dominates render time. The CSS Custom Highlight API
([MDN](https://developer.mozilla.org/docs/Web/API/CSS_Custom_Highlight_API))
paints ranges without mutating the DOM tree, removing that cost.

Browser support shipped over 2024–2025 (Chromium 105+, Safari 17.2+,
Firefox 140+). It is now realistic to expose this engine to consumers
with a graceful fallback for older browsers.

The roadmap (`docs/ROADMAP.md` v2.0 entry) had three open questions:
1. Per-instance namespace scoping vs. global namespace.
2. Multi-state composition through `highlight-order`.
3. Browser support — polyfill or graceful degradation.

This ADR resolves all three, plus the API-shape question of how
consumers opt in.

## Decision

Ship the engine as a new sub-export `one-more-highlight/css` exposing a
new component `<CssHighlight>` with a `fallback?: 'dom' | 'none' |
'throw'` prop (default `'dom'`). The default `<Highlight>` component is
unchanged. The matching pipeline (`findMatches` → `combineChunks` →
`applyStates` → `buildSegments`) is shared between both engines via the
existing `useHighlight` hook.

Multi-state composition uses one `Highlight` per state name in
`CSS.highlights`; authors write `::highlight(name) { … }` themselves and
control priority via `highlight-order`. Namespaces are global —
collisions across instances are intentional and documented.

## Why

1. **Performance is the load-bearing motivation.** All other claimed
   benefits (DOM cleanliness, a11y, native-search feel) are secondary
   and would not justify a new engine on their own.
2. **Sub-export beats engine prop today.** A `/css` entry tree-shakes
   cleanly — consumers of the default entry pay zero bytes for the new
   engine code. A unified `<Highlight engine="…">` shape can be
   re-evaluated once we have real-world usage; see "Future work" in the
   spec.
3. **Configurable fallback respects consumer intent.** A perf engine
   that silently fails in older browsers is fine; a strict consumer who
   wants to fail loudly can opt in via `'throw'`.
4. **Author CSS wins over library style synthesis.** The library
   already commits to being unstyled by design (per root CLAUDE.md);
   injecting `<style>` tags at runtime would break that contract and
   complicate CSP, SSR, and theming. The trade-off — consumers write
   `::highlight(name)` — is documented loudly.
5. **Global namespace is native semantics.** Authors get one CSS rule
   that styles every instance, which is the common case. If they need
   scoping, prefixing their state names is one keystroke.

## Consequences

- **Additive public API.** Minor version bump (no breaking changes).
- **New sub-export entry** in `package.json#exports`. Two new
  `size-limit` budgets (3 KB brotlied each for `dist/css.js` and
  `dist/css.cjs`).
- **`<CssHighlight>` does not support `renderMatch`, `highlightTag`,
  `unhighlightTag`, or inline `style`/`className` on `HighlightState`** —
  these have no meaning when matches aren't DOM nodes. Documented in
  the engine docs page.
- **The `'dom'` fallback path imports the DOM `<Highlight>`.** That
  duplicates the renderer between the two entries; the cost is paid by
  consumers who actually opt into `/css`. A future refactor to share
  the renderer is listed in the spec's Future Work section.
- **Pipeline files untouched.** `findMatches`, `combineChunks`,
  `applyStates`, `buildSegments`, `useHighlight` are unchanged.
- **CLAUDE.md guidance unchanged.** The 6 core principles still apply.
  The "smallest diff" rule was followed: no new runtime dependency, no
  refactor of existing engine code, type narrowing follows existing
  discriminated-union patterns.

## Alternatives considered

### Engine prop on `<Highlight>`

`<Highlight engine="css-highlights" fallback="dom">` with a
discriminated-union props type making `fallback` only typecheck when
`engine` is set. **Rejected for now** because it commits the public API
to a single component shape before we have usage data. Sub-export is
reversible — we can collapse into the engine prop later by re-exporting
`<CssHighlight>` from the default entry. Going the other direction is a
breaking change.

### Separate full component (`<HighlightFast>`)

Doubles the React component surface forever; every doc/example/snapshot
covers both. **Rejected** — the sub-export approach gets the same
tree-shaking benefit without doubling the API.

### Polyfill for older browsers

Polyfilling `CSS.highlights` is complex and would itself bloat the
bundle. **Rejected** — `fallback="dom"` covers older browsers
transparently with code we already have.

### Library-synthesized `<style>` tag

Accept `className`/`style` on `HighlightState` and inject a stylesheet at
runtime so consumers don't have to write CSS. **Rejected** — breaks the
unstyled-by-design pitch, complicates SSR and CSP, and the
per-state-name `::highlight()` selector is short enough that the
ergonomic loss is small.

## Do not re-propose

A future contributor may suggest collapsing `<CssHighlight>` into a
`<Highlight engine="…">` prop. That is on the roadmap as future work —
the deferral is deliberate, not an oversight. Re-litigate only after we
have evidence (consumer feedback, usage telemetry) that one shape is
clearly better than the other. The sub-export gives us reversibility;
spending that optionality up front earns nothing.

## Pre-release validation (2026-05-18)

Before tagging the release, the deferral decision was re-tested against
real adoption signal for the CSS Custom Highlight API in the React
ecosystem. The data confirmed the deferral.

**Adoption signal: niche, no React groundswell.**

- **npm download ratios:** `react-highlight-words` ≈ 1.42M weekly,
  `mark.js` ≈ 3.07M weekly. The known CSS-Highlights React libraries
  combined sit at ≈ 8.4K weekly (`highlight-search-term` ≈ 8.3K,
  `react-css-highlight` ≈ 131). That's ~10,000× more downloads for the
  DOM-wrapping incumbents.
- **Hacker News flat-zero:** the three Custom-Highlight-API submissions
  from 2025 (Firefox 140 ship, `<syntax-highlight>` element, MDN docs)
  each scored 1–2 points / 0 comments.
- **Evangelism cluster sits outside React:** coverage is on web.dev,
  MDN, CSS-Tricks, Frontend Masters. No r/reactjs thread of substance,
  no Next.js docs mention, no dev.to viral post.
- **Real friction items surfacing in posts:** SSR pop-in (no
  server-side highlights), Firefox 140 ignores `text-decoration` on
  `::highlight()`, Safari 17.2 ignores highlights under
  `user-select: none`, range invalidation under virtualization. Each is
  a reason a consumer aware of the API still picks the DOM engine.

**Implication for the sub-export decision:** the expected usage pattern
is "one engine per app, and that engine is the DOM engine for the vast
majority of consumers for at least the next 12-18 months." Tree-shaking
the CSS engine code out of default-entry bundles is the right
optimization for that pattern. Unifying under `<Highlight engine="…">`
would force every consumer to pay for the CSS engine code path even
when they never opt in — which is the wrong trade given the data.

**Trigger to revisit:** if any of the following holds, re-open this ADR
and reconsider unification.

- A CSS-Highlights-based React library crosses ~50K weekly npm
  downloads.
- r/reactjs or r/javascript surfaces a substantive thread requesting
  the CSS engine, or comparing CSS vs. DOM highlight libraries.
- Firefox / Safari close their known interop gaps
  (`text-decoration`, `user-select: none`), and SSR pop-in gets a
  documented workaround.
- A major React-ecosystem library (Next.js docs, a popular DataGrid,
  etc.) adopts the API and points readers at our `/css` entry.
