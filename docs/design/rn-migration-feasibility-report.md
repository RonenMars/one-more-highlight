# React Native Migration Feasibility — `one-more-highlight`

> Analysis date: 2026-07-10 · Audited repo: `one-more-highlight` @ `main` (v1.2.0)
> Scope: read-only audit — no RN code scaffolded.

**TLDR: Difficulty Low–Medium. ~55% of the library is portable as-is, ~23% (the `/css` engine) has no RN equivalent and gets dropped, and the real work is one new ~130-line `<Text>`-based renderer plus type surgery and test infra. Estimate 3–5 days for the lean path, 6–9 days for a full monorepo split. Recommendation: conditional go — but start with a near-zero-cost step, because `useHighlight` already works on React Native today.**

---

## Phase 1 — Codebase Audit

### Structure

```
src/
├── types.ts             109 lines  — all exported types
├── escapeRegex.ts         8        — native RegExp.escape → escape-string-regexp fallback
├── findMatches.ts        51        — String.prototype.matchAll collection
├── combineChunks.ts      61        — merge | nest | first-wins
├── applyStates.ts       159        — state selector resolution + dev warnings
├── buildSegments.ts      47        — chunks → alternating Segment[]
├── useHighlight.ts       84        — the hook (useMemo + structural keys)
├── Highlight.tsx        131        — DOM renderer (<mark>, clsx, role="mark")
├── index.ts              23
└── css/                 198        — CSS Custom Highlight API engine (subpath export)
    ├── CssHighlight.tsx, supported.ts, types.ts, useIsomorphicLayoutEffect.ts, index.ts
```

### Classification

**Pure logic (zero React, zero DOM):** `escapeRegex`, `findMatches`, `combineChunks`, `applyStates`, `buildSegments` — 326 lines. A grep of the whole of `src/` for `window|document|globalThis|navigator|HTMLElement` hits *only* inside `src/css/` (plus one comment). The SSR discipline in CLAUDE.md paid off — the matching pipeline is genuinely platform-free. `process.env.NODE_ENV` and `console.warn` (used for dev warnings) both work under Metro/Hermes.

**React-but-platform-agnostic:** `useHighlight.ts` imports only `useMemo`/`useRef` from `react` — no DOM types, no `react-dom`. It is portable **as-is**, with two footnotes:

- `useHighlight.ts:54` uses `WeakRef` in the dev-only regex-identity warning. Hermes supports `WeakRef` on modern RN (0.70+); ancient Hermes would throw in dev. Trivial guard if you care.
- The `HighlightState` type it accepts carries `className?: string; style?: CSSProperties` (`types.ts:28-32`) — semantically web-flavored, but the hook never touches those fields (only `applyStates` reads selectors + `name`), so it's a *typing* issue, not a runtime one.

**DOM-only:** `Highlight.tsx` — `<mark>` default tag, `role="mark"` fallback for non-semantic tags (`Highlight.tsx:65`), `clsx` className merging, `keyof JSX.IntrinsicElements` string tags, `forwardRef<ElementRef<'span'>>`. Plus the web-flavored slice of `types.ts` (`HighlightProps`, `HighlightTagProps`, `MatchDefaults`).

**Web-only, no equivalent:** everything under `src/css/` — `CSS.highlights` registry, `document.createRange()`, `Text` node instanceof checks, `Highlight` constructor. RN has no CSS painting API; this engine cannot exist there in any form.

### Build/config assumptions

- `package.json`: peer dep is `react >=18` only — **no `react-dom` peer**, which is exactly right for RN reuse. Two runtime deps: `escape-string-regexp` (pure, portable; v5 is ESM-only but Metro transpiles node_modules, and older Metro falls back to the CJS `main` field — both paths work) and `clsx` (only needed by the DOM renderer; an RN entry wouldn't import it).
- `tsconfig.json:4` includes `lib: ["DOM", "DOM.Iterable"]` — a shared core would want a DOM-free tsconfig to *prove* purity, and an RN entry needs a separate tsconfig anyway (RN's global types conflict with `lib: DOM` in one compilation unit).
- `tsup` dual ESM/CJS with `exports` map: RN-compatible as-is. Metro resolves `exports` by default on RN 0.79+, `main` before that.
- `size-limit` budgets are web bundle concerns; irrelevant to an RN entry but unaffected by one.

### Test coverage

- **Pure suites** (`applyStates`, `buildSegments`, `combineChunks`, `findMatches`, `fuzz` with fast-check) import only `src/*` + vitest — they'd move to a core package **unchanged** and could run under `environment: 'node'`.
- **Component/hook suites** (`Highlight`, `useHighlight`, `ssr`, all three `CssHighlight` suites) use `@testing-library/react`, jsdom, and `react-dom/server` — these stay with the web package. RN component tests need different infra: `@testing-library/react-native` assumes Jest, which this repo doesn't use (vitest). Workable options: a small Jest config scoped to the native entry, or aliasing `react-native → react-native-web` under vitest (approximates Text-nesting semantics, doesn't prove device behavior).
- **Playwright visual suite** (5-project device matrix): no RN analog. Device-level visual regression means Maestro or Expo E2E screenshots — realistically out of scope for v1 of RN support.

---

## Phase 2 — Feasibility Matrix

| Module | Classification | Effort | Notes / API gap |
| --- | --- | --- | --- |
| `escapeRegex.ts` | Portable as-is | — | `RegExp.escape` absent on Hermes today → falls back to `escape-string-regexp`, by design |
| `findMatches.ts` | Portable as-is | — | `matchAll` supported by Hermes. Consumer-supplied regexes run on Hermes, which historically lagged on lookbehind/Unicode property escapes (fine on RN 0.73+) — docs note, not a code change |
| `combineChunks.ts` | Portable as-is | — | |
| `applyStates.ts` | Portable as-is | — | `WeakSet` fine on Hermes |
| `buildSegments.ts` | Portable as-is | — | Code-unit slicing identical on both platforms; grapheme limitation unchanged |
| `useHighlight.ts` | Portable as-is | **S** | Guard the dev-only `WeakRef` for old Hermes; otherwise zero changes |
| `types.ts` | Portable with light abstraction | **S/M** | Split selector types (pure) from styling fields. `HighlightStateBase.style: CSSProperties` must become generic or platform-extended (`TextStyle` on RN); `className` has no RN meaning; `keyof JSX.IntrinsicElements` is DOM-only |
| `Highlight.tsx` | Parallel RN implementation | **M** | New `<Text>`-nesting renderer (~100–150 lines). Gaps: no `<mark>` semantics or `role="mark"` (RN's `role` set has no `mark` — a11y downgrade); nested-`Text` style inheritance differs from DOM wrapping (Android lineHeight/vertical-alignment quirks, no borderRadius on Android text spans); truncation (`numberOfLines`) is decided by the outer `Text`; per-match `onPress` works but hit-targets behave differently than DOM |
| `index.ts` | Trivial glue | S | New entry per platform |
| `src/css/*` (whole engine) | **No RN equivalent — drop** | — | `CSS.highlights`, `Range`, `Text` nodes don't exist in RN. Not reimaginable: the API's entire value (paint without DOM mutation) has no RN analog. RN gets the component engine only |
| Test suites (pure) | Portable as-is | — | Move with core, zero edits |
| Test suites (component/SSR/visual) | Parallel infra | **M** | RN Testing Library ⇒ Jest or RN-web aliasing; Playwright matrix has no RN analog; SSR tests are meaningless for RN |

By line count: **~55% portable as-is** (pipeline + hook + pure types), **~6% light abstraction** (type surgery), **~16% parallel implementation** (DOM renderer → Text renderer), **~23% dropped** (`/css`).

---

## Phase 3 — Shared-Code Strategy

### Recommended: same package, `/native` subpath first

Before a monorepo, note what's already true: **the published package's main entry has zero DOM reads at runtime.** An RN app can `import { useHighlight } from 'one-more-highlight'` *today* and render segments as nested `<Text>` in ~20 lines. The only costs are cosmetic (web-flavored `style` typing, `clsx` + `Highlight.tsx` as dead bytes in the Metro bundle, since Metro doesn't tree-shake).

So the smallest shippable RN support is a third tsup entry in the existing package:

```
one-more-highlight (unchanged package)
├── src/            ← untouched: pipeline + hook + DOM renderer
├── src/css/        ← untouched: web-only subpath
└── src/native/     ← NEW: index.ts + HighlightText.tsx (~150 lines)
    exports "./native" in package.json; react-native as optional peer;
    own tsconfig (no DOM lib) to avoid RN/DOM global type conflicts
```

No new npm package, no release-pipeline change (semantic-release stays single-package), pnpm workspace untouched except an optional `examples/expo` app. This mirrors how many libraries ship RN support (`pkg/native`).

### If RN grows its own roadmap: the monorepo split

```
packages/
├── core/                 # unpublished or one-more-highlight-core
│   ├── types.ts          # selector types, Segment, RawChunk, FindChunksInput
│   │                     # HighlightStateBase = { name } — styling fields move out
│   ├── escapeRegex / findMatches / combineChunks / applyStates / buildSegments
│   ├── useHighlight.ts   # peer: react only (react itself is platform-neutral)
│   └── tests/            # the 5 pure suites + fuzz, environment: node
├── react/                # publishes as `one-more-highlight` (name/API preserved)
│   ├── re-exports core; HighlightState = CoreState & {className?, style?: CSSProperties}
│   ├── Highlight.tsx, css/ subpath, jsdom + Playwright suites
├── react-native/         # `one-more-highlight-native`
│   ├── re-exports core; HighlightState = CoreState & {style?: StyleProp<TextStyle>}
│   ├── HighlightText.tsx, Jest/RNTL suite
└── (shared tsconfig base; pnpm workspace already in place)
```

The pnpm workspace extension is low-friction. The *hidden* cost is releases: semantic-release is single-package-oriented; a real monorepo means migrating to changesets or `semantic-release-monorepo` — that's a day by itself and touches CI, `.releaserc.json`, and the commit-scope → bump rules in CLAUDE.md.

### Public API contract: web vs RN

| Surface | Web (unchanged) | RN |
| --- | --- | --- |
| `useHighlight`, selectors (`index`/`range`/`indices`/`term`/`nth`), `overlapStrategy`, `sanitize`/`findChunks`/`autoEscape`/`caseSensitive`, `getMatchCount` | identical | identical |
| `highlightClassName` / `unhighlightClassName` / `HighlightState.className` | kept | **absent** — styles only |
| `style` types | `CSSProperties` | `StyleProp<TextStyle>` |
| `highlightTag` / `unhighlightTag` / `as` | string tags or component | custom component only (no intrinsic strings) |
| `renderMatch(seg, defaults)` | kept | kept; `defaults` = `{ style, Tag: Text }`, no `className` |
| `role="mark"` a11y fallback | kept | no equivalent — documented gap |
| `/css` subpath (`CssHighlight`) | kept | **does not exist** |

**Breaking-change verdict for existing web consumers: none**, provided the web package re-exports a concrete `HighlightState` alias with the exact current shape. If core's base type goes generic, the alias keeps assignability; every current import path and prop keeps working.

---

## Phase 4 — Verdict

**1. Difficulty: Low–Medium.** Low because the pipeline (~55% of lines) ports with zero changes — a direct dividend of the SSR-safety rules. The Medium half is not the port itself but the surroundings: nested-`Text` rendering fidelity, a second test toolchain, and (only if you go monorepo) the release-pipeline migration.

**2. Effort (one developer who knows this codebase):**

- `/native` subpath path: **3–5 days** — ~1 day renderer + type split, ~1–2 days test infra (Jest-scoped or RN-web-aliased) + an Expo example to verify on-device, ~1 day docs/README/exports/CI.
- Full monorepo path: **6–9 days** — the above plus package split, changesets migration, CI and commit-scope rework.

**3. Recommended structure:** the `/native` subpath tree above; the monorepo tree is the documented scale-up path, not the starting point.

**4. Top 3 technical risks:**

1. **Nested `<Text>` ≠ `<mark>` wrapping.** Android text spans have real quirks — lineHeight/baseline shifts when a span changes fontSize, `backgroundColor` paints differently than `<mark>`, no per-span borderRadius, and `numberOfLines` truncation is controlled by the outer `Text`. Visual parity is approximate, and there's no Playwright-equivalent safety net to catch regressions.
2. **The `/css` engine — the library's differentiator — has no RN story.** RN support ships only the component engine, so the product narrative splits: docs, playground, and marketing all assume two engines; RN gets one.
3. **Toolchain bifurcation.** vitest+jsdom can't exercise RN components (RNTL wants Jest), the visual suite doesn't translate, and Hermes lags occasionally (dev-only `WeakRef` at `useHighlight.ts:54`, consumer regex features on older RN). Each is small; together they make the second platform a standing tax on every future change — which matters for a repo whose CLAUDE.md demands demos/tests/snapshots stay in sync per change.

**5. Go/no-go: conditional go, staged by demand.**

- **Step 0 (hours, do regardless):** document the "use `useHighlight` + nested `<Text>`" recipe — the package supports RN *today* for anyone using the hook. The reuse value is already captured without shipping anything.
- **Step 1 (go if there's demonstrated demand — issues, requests, RN downloads):** ship the `/native` subpath, 3–5 days, no breaking changes, no new package.
- **Monorepo: no-go for now.** Its costs (release migration, second package's test matrix and issue stream) buy nothing the subpath doesn't, for a library whose pitch is "tiny + auditable". Revisit only if RN accumulates its own roadmap (grapheme handling, Maestro visual tests, RN-specific props).

The tradeoff made explicit: maintenance of a second render target is permanent, demand is currently unproven, but the marginal cost of *offering* RN support is unusually low here because the architecture already isolated everything platform-specific. Staging by demand captures the upside without committing to the burden up front.
