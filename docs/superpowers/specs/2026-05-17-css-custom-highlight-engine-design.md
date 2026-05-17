# CSS Custom Highlight API Engine — Design

- **Date:** 2026-05-17
- **Author:** Ronen Mars
- **Status:** Draft (pending implementation)
- **Roadmap entry:** `docs/ROADMAP.md` → "v2.0 — CSS Custom Highlight API engine"

## Goal

Ship an opt-in rendering engine that paints highlights via the browser's
[CSS Custom Highlight API](https://developer.mozilla.org/docs/Web/API/CSS_Custom_Highlight_API)
instead of `<mark>` DOM nodes. The motivation is **performance on long text**:
range-based painting avoids per-match DOM nodes, giving ~10× speedup on
documents in the tens-of-KB range.

The matching pipeline (`findMatches` → `combineChunks` → `applyStates` →
`buildSegments`) is unchanged. Only the **render step** swaps.

## Non-goals

- Replacing the DOM engine. `<Highlight>` stays the default and the
  recommended choice for short text, where DOM mutation cost is negligible
  and `renderMatch`/`highlightTag` ergonomics matter more than raw speed.
- Polyfilling the API in browsers that lack it. We fall back to the DOM
  engine instead.
- Synthesising CSS at runtime. The library does not inject `<style>` tags.
  Authors write `::highlight(name) { … }` themselves.
- Per-instance namespace isolation. `CSS.highlights` is intentionally
  exposed as a global namespace (see "Decisions" below).

## Architecture

### Sub-export

A new entry point: `one-more-highlight/css`.

```ts
// package.json#exports
"./css": {
  "types": "./dist/css.d.ts",
  "import": "./dist/css.js",
  "require": "./dist/css.cjs"
}
```

The default entry (`one-more-highlight`) is **untouched** — consumers who
don't import the sub-export pay zero bytes for the new engine. Tree-shaking
is enforced by `size-limit` budgets per entry (3 KB brotlied each).

### Public surface (new)

```ts
// one-more-highlight/css
export { CssHighlight } from './CssHighlight.js';
export type { CssHighlightProps, CssHighlightFallback } from './types.js';
```

`CssHighlightProps`:

```ts
type CssHighlightFallback = 'dom' | 'none' | 'throw';

interface CssHighlightProps extends UseHighlightOptions {
  fallback?: CssHighlightFallback;       // default: 'dom'
  as?: keyof JSX.IntrinsicElements;      // default: 'span'
  className?: string;
  style?: CSSProperties;
  // Deliberately absent (no meaning in this engine):
  //   highlightTag, renderMatch,
  //   highlightClassName, highlightStyle,
  //   unhighlightTag, unhighlightClassName, unhighlightStyle
}
```

### Shared internals (unchanged)

`findMatches`, `combineChunks`, `applyStates`, `buildSegments`,
`useHighlight`. The CSS engine consumes the same `Segment[]` that the DOM
engine does — pipeline files do not learn about the engine.

### Pipeline diagram

```
findMatches → combineChunks → applyStates → buildSegments
                                                   ↓
                                          segments: Segment[]
                                                   ↓
                                  ┌────────────────┴────────────────┐
                                  │ DOM engine          CSS engine  │
                                  │ (<Highlight>)       (<CssHighlight>)
                                  │                                 │
                                  │ map segments        render text;
                                  │   → <mark> spans     effect builds
                                  │                      Range per state
                                  │                      name; registers
                                  │                      with CSS.highlights
                                  └─────────────────────────────────┘
```

## Component & registry mechanics

### Render output

`<CssHighlight>` renders the wrapper element with the **raw text as a
single Text node child** — no per-segment elements:

```tsx
<span ref={containerRef} className={className} style={style}>
  {text}
</span>
```

The wrapper anchors a `ref` so the layout effect can locate the Text node
(`containerRef.current.firstChild`).

### Effect logic

```ts
useLayoutEffect(() => {
  if (!supported()) return runFallback(fallback);

  const textNode = containerRef.current?.firstChild;
  if (!(textNode instanceof Text)) return;

  // Group match segments by state name.
  // Matches with no states join the implicit 'match' bucket,
  // mirroring the DOM engine's default <mark>.
  const byState = new Map<string, Range[]>();
  for (const seg of segments) {
    if (!seg.isMatch) continue;
    const r = document.createRange();
    r.setStart(textNode, seg.start);
    r.setEnd(textNode, seg.end);
    const names = seg.states.length > 0 ? seg.states : ['match'];
    for (const name of names) {
      const bucket = byState.get(name) ?? [];
      bucket.push(r);
      byState.set(name, bucket);
    }
  }

  // Merge into the global registry. Track per-instance ownership
  // so cleanup deletes only what we added.
  const ownedRanges = new Map<string, Range[]>();
  for (const [name, ranges] of byState) {
    let h = CSS.highlights.get(name);
    if (!h) {
      h = new Highlight(...ranges);
      CSS.highlights.set(name, h);
    } else {
      for (const r of ranges) h.add(r);
    }
    ownedRanges.set(name, ranges);
  }

  return () => {
    for (const [name, ranges] of ownedRanges) {
      const h = CSS.highlights.get(name);
      if (!h) continue;
      for (const r of ranges) h.delete(r);
      if (h.size === 0) CSS.highlights.delete(name);
    }
  };
}, [segments, fallback]);
```

### Implicit `match` state

Matches with `seg.states.length === 0` register under the state name
`'match'`. Authors write `::highlight(match) { … }` for the "just highlight
everything" case, matching the DOM engine's default `<mark>` ergonomics.

### Per-instance ownership

The closure-scoped `ownedRanges` map is the correctness pivot. Without
it, two `<CssHighlight>` instances on the same page would clobber each
other's ranges on unmount. With it, each instance deletes only the Ranges
it added; sibling instances are unaffected.

### Feature detection

```ts
const supported = (): boolean =>
  typeof CSS !== 'undefined' &&
  typeof CSS.highlights !== 'undefined' &&
  typeof Highlight === 'function';
```

Runs at module init, cached. No per-render cost.

### Fallback behavior

| `fallback` | Unsupported browser behavior |
| --- | --- |
| `'dom'` (default) | Internally render via the DOM engine. Sub-export bundle includes the DOM renderer for this path. Same visual result as `<Highlight>`. |
| `'none'` | Render the plain text wrapper, no highlights painted. No warning. |
| `'throw'` | Throw on first render with a message naming the missing feature. Opt-in for consumers who want to fail loudly. |

The default-`'dom'` path means the sub-export bundle currently carries a
copy of the DOM renderer. A future refactor (see "Future work") could
extract the renderer into a shared internal so neither entry duplicates
it; that is not part of this scope.

## Data flow & lifecycle

**Initial mount (supported browser):**

1. `useHighlight()` → memoized `segments`.
2. React renders `<span ref={…}>{text}</span>`. DOM has one Text node, no
   highlights painted yet.
3. `useLayoutEffect` runs synchronously before paint → builds `Range[]`
   per state name, registers with `CSS.highlights`. First paint shows
   highlights — no flash.

**Update (text or searchWords change):**

1. New `segments` reference identity.
2. Previous effect's cleanup runs first → removes our Ranges from each
   global `Highlight`; prunes empty `Highlight`s from the registry.
3. New effect runs → rebuilds and re-registers.

React reuses the same Text node for string children of the same element,
so Range anchoring is stable across text content changes.

**Unmount:** cleanup deletes only this instance's Ranges. Other
`CssHighlight` instances retain their Ranges in the same global
`Highlight`.

**Strict Mode double-invocation:** effect → cleanup → effect again.
Cleanup uses the closure-scoped `ownedRanges`, so the second run starts
from a clean slate. Safe.

**SSR:**

- Server renders `<span>{text}</span>` — no markup beyond the wrapper, no
  `data-*` attributes.
- Client hydrates the same DOM.
- Layout effect runs client-side only. Introduce a small
  `useIsomorphicLayoutEffect` helper (4-line shim aliasing to `useEffect`
  when `typeof window === 'undefined'`) — kept private to the `/css`
  sub-export. The DOM engine doesn't need it.
- No hydration mismatch — server output and client's first render are
  byte-identical. The effect only mutates `CSS.highlights`, never the DOM
  tree.

### Rapid-update edge case

If a consumer mutates `text` so fast that React batches two updates, the
previous effect's cleanup and the new effect's setup happen in the same
microtask. `CSS.highlights` reflects the final state. There is no
interleaved-paint problem because layout effects run before paint.

**This edge case is documented in the user-facing docs page** (see "Docs
impact" below) so consumers understand the timing guarantee.

## Error handling & dev warnings

### Hard errors (throw)

- `fallback === 'throw'` + unsupported browser → throw on first render
  with a message naming the browser/feature missing.

### Dev-only warnings

Gated through `process.env.NODE_ENV !== 'production'` and a `WeakSet` so
each warning fires once per props reference (same pattern as
`src/applyStates.ts` lines 19–35):

1. **`style` / `className` on `HighlightState`** — inert in the CSS
   engine (painting is via author CSS, not inline style). Warn once,
   point to the engines/css-highlights docs page.
2. **Reserved state names** — `none`, `initial`, `inherit`, `revert`,
   `unset`. These would make `::highlight(name)` unusable. Warn and
   suggest renaming.
3. **Wrapper has non-Text first child** — can happen if a wrapping HOC
   inserts content between us and the text. Warn and skip registration.

No runtime check for absent props like `renderMatch` or `highlightTag` —
TypeScript rejects them at compile time via `CssHighlightProps`.

### Silent no-ops

- Unsupported browser + `fallback === 'none'` → render plain text, no
  warning. Consumer opted into this.
- Cleanup when the underlying Text node is gone (parent unmounted before
  cleanup ran) → skip the `Range` lookup. Browser GC handles orphaned
  Ranges.

### No defensive try/catch

`CSS.highlights.set` and `new Highlight(...)` are spec-defined to not
throw under normal conditions. Wrapping them would mask genuine bugs.
Trust the platform.

## Testing

Mirrors the existing `tests/` layout 1-to-1.

**Unit tests** (`tests/CssHighlight.test.tsx`):

- Renders a single Text node child; zero `<mark>` spans.
- `CSS.highlights.set(name, …)` called once per state name present in
  segments.
- Cleanup removes only this instance's Ranges; sibling instances
  unaffected.
- Implicit `match` state: stateless matches register under `'match'`.
- Update path: changing `text` rebuilds Ranges and re-registers; old
  Ranges removed first.
- Strict-mode double-invoke: end state matches single-mount baseline.

**Fallback tests** (`tests/CssHighlight.fallback.test.tsx`):

- Stub `globalThis.CSS` to `undefined`.
- `'dom'` (default) → `<mark>` spans equivalent to `<Highlight>` output.
- `'none'` → plain text, no warning.
- `'throw'` → throws with browser-naming message.
- Feature-detect runs once per module load, cached.

**SSR test** (`tests/CssHighlight.ssr.test.tsx`):

- `renderToString` → `<span>{text}</span>` only. No `<mark>`, no
  `data-*`, no highlight-related inline style.
- No `window` / `document` / `CSS.highlights` access during render
  (existing `tests/ssr.test.tsx` pattern with happy-dom off).

**Visual tests** (`tests/visual/`):

- New playground demo `examples/playground/src/demos/CssEngine.tsx`
  toggling between DOM and CSS engines with identical state config.
- Author-supplied CSS in `examples/playground/src/index.css`:
  ```css
  ::highlight(match)  { background: var(--hl-yellow); color: var(--hl-text); }
  ::highlight(active) { background: var(--hl-green);  color: var(--hl-text); }
  ::highlight(pinned) { background: var(--hl-pink);   color: var(--hl-text); }
  ```
- Visual snapshot at the 5-project matrix (chromium/firefox/webkit
  desktop ×2 DPR + mobile-iphone + mobile-android ×3 DPR).
- Pin Playwright browser versions to ones that support the Highlight API;
  document in `tests/visual/README.md`.

**Property-based tests:** the matching pipeline is unchanged, so
`tests/fuzz.test.ts` already covers correctness up to the segment level.
No new fuzz suite needed.

**`pnpm verify`:** the existing
`typecheck + test + test:visual + build + lint:pkg + size` gate covers
everything. Add a separate 3 KB brotlied `size-limit` budget for
`dist/css.js`.

## Docs impact

Per the CLAUDE.md "demos, tests, snapshots in sync" rule.

**Library docs site** (`docs/site/`):

- New page `docs/site/docs/engines/css-highlights.md` covering: when to
  use, opt-in via sub-export, `fallback` prop, author-CSS contract
  (`::highlight(name)`), implicit `match` state, limitations (no
  `renderMatch`, no `highlightTag`, no inline `style` on states), and the
  **rapid-update edge case** note about effect cleanup ordering.
- README — new "Engines" section linking to the page; perf claim with a
  benchmarked number filled in during implementation.
- `docs/ROADMAP.md` — move v2.0 line to "Done in v2.0" once shipped; add
  under v2.x: *"Unify `<Highlight>` and `<CssHighlight>` under a single
  component with a discriminated-union `engine` prop — defer until usage
  tells us which shape is right."*

**Playground** (`examples/playground/`):

- New `CssEngine.tsx` demo (basis for the visual test above).
- Update the demo index to surface engine switching.

**Sidebars** (`docs/site/sidebars.ts`):

- Add the `engines/css-highlights` entry.

**ADR:**

- New `docs/adr/0002-css-custom-highlight-engine.md` capturing: sub-export
  shape, global namespace decision, no inline-style support in this
  engine, deferred unification. Use the ADR template; reference ADR-0001
  in the "Do not re-propose" section style.

**Changelog:**

- `feat(src): css-highlights engine via /css sub-export` — minor bump
  (additive: `<Highlight>` is unchanged).

## Decisions (locked in this design)

1. **Performance is the primary motivation.** Long-text speedup is what
   justifies the new engine. Other claimed benefits (DOM cleanliness,
   a11y, native-search feel) are secondary and not load-bearing.
2. **Sub-export, not engine prop.** `one-more-highlight/css` ships its
   own `<CssHighlight>` component with a `fallback` prop. Tree-shakes
   cleanly from the default entry. Unification under a single
   `<Highlight engine="…">` component is on the roadmap as a future
   investigation.
3. **Configurable fallback, default `'dom'`.** Per-instance `fallback`
   prop with three modes (`'dom' | 'none' | 'throw'`). Most consumers
   get transparent degradation; opinionated consumers can opt in to
   stricter behavior.
4. **Multi-state composition via author CSS.** Library registers one
   `Highlight` per state name. Author writes `::highlight(name)` and
   controls priority via `highlight-order`. The library does not
   synthesise CSS.
5. **Global namespace, documented loudly.** State names map directly to
   `CSS.highlights` keys. Two `<CssHighlight>` instances on the same page
   using the same state name share that registry. No per-instance
   prefixing.
6. **Implicit `match` state.** Matches with no `states` register under
   `'match'`, so authors have a single CSS hook for the default case.
7. **Implementation approach: `useLayoutEffect` + plain text +
   `Range[]` per state name.** No `useSyncExternalStore`, no ref-callback
   trickery. Standard React effect lifecycle.

## Future work (out of scope for this design)

- **Unify `<Highlight>` and `<CssHighlight>` under one component.** Once
  we have real-world usage, decide whether a discriminated-union
  `engine` prop is the right shape, or whether the two components should
  stay separate. Roadmap entry to be added.
- **Extract the DOM renderer into a shared internal** so the
  `fallback='dom'` path doesn't duplicate it from the default entry.
- **Drop `escape-string-regexp`** when `RegExp.escape()` is universally
  available (existing roadmap item, unrelated to engines).
- **Grapheme-aware matching** via `Intl.Segmenter` (existing v2.x
  roadmap item, unrelated).

## Commit plan

Per the project's commit conventions in CLAUDE.md:

1. `feat(src): add /css sub-export with CssHighlight engine` — library
   code, unit tests, SSR test, fallback tests, ADR-0002.
2. `feat(playground): add CSS engine demo` — playground demo, demo
   index update, visual snapshot regeneration.
3. `docs: document css-highlights engine, link from README + sidebar` —
   docs site page, README section, roadmap update, `sidebars.ts`.

Only commit 1 ships a library bump. Commits 2 and 3 are scoped to
non-bumping paths.
