# Design: Live Docs Site + Browser Support Matrix

**Date:** 2026-05-11  
**Scope:** Build a Docusaurus docs site at `docs/site/`, deployed via Vercel. Add browser support matrix as a Recipes page.

---

## What we're building

A Docusaurus-based documentation site that replaces the minimal playground as the public face of `one-more-highlight`. It combines prose API documentation, interactive inline demos, and a dedicated playground page — all deployed via the existing Vercel integration.

The current `examples/playground/` app remains in the repo as the source of the `<LiveDemo>` component used in guide pages.

---

## Site structure

Five top-level navigation sections:

### Getting Started
- **Introduction** — what the library is, why it exists, install command
- **Installation** — `pnpm/npm/yarn add`, peer deps, browser/Node requirements
- **Quick start** — minimal working example, link to full playground

### Guides
Each guide page has an inline `<LiveDemo>` component showing the feature.
- **Basic highlighting** — `searchWords`, `highlightClassName`, `caseSensitive`, `autoEscape`
- **Multi-state styling** — `states`, `match.one/range/many`, how classes compose
- **Headless hook** — `useHighlight`, `Segment[]`, DIY rendering
- **Render prop** — `renderMatch`, full per-match control

### API Reference
Prose-first pages with full prop tables (migrated from README) and TypeScript type signatures.
- **`<Highlight>` props** — all props with type, default, description
- **`useHighlight`** — options, return type, `Segment` / `MatchSegment` / `TextSegment`
- **`match` builders** — `match.one`, `match.range`, `match.many` with type signatures
- **TypeScript types** — exported types: `HighlightState`, `OverlapStrategy`, `Segment`, etc.

### Recipes
Short focused pages for common patterns.
- **Diacritic-insensitive search** — `sanitize: (s) => s.normalize('NFD').replace(...)` recipe
- **Browser support matrix** — table of supported browsers/environments (see below)
- **Overlap strategies** — when to use `merge` vs `nest` vs `first-wins`, with demos

### Playground
A full-width dedicated page hosting all four existing demos from `examples/playground/src/App.tsx`:
1. Basic — every match highlighted
2. Multi-state — base + active + preview + bookmarked
3. Render-prop — star badge on active match
4. Headless hook — DIY rendering

---

## Browser support matrix (content)

The **Browser support** recipe page contains:

| Environment | Support | Notes |
|---|---|---|
| Chrome / Edge 112+ | ✅ Full | Native `RegExp.escape()` available |
| Firefox 134+ | ✅ Full | Native `RegExp.escape()` available |
| Safari 18.4+ | ✅ Full | Native `RegExp.escape()` available |
| Older evergreen browsers | ✅ Full | Falls back to `escape-string-regexp` automatically |
| Node.js 18+ | ✅ Full | Required by `escape-string-regexp` ESM |
| Node.js < 18 | ❌ | `escape-string-regexp` v5 is ESM-only |
| React Native | ⚠️ Untested | No known blockers; no `window`/`document` usage |
| SSR (Next.js, Remix) | ✅ Full | Pipeline is SSR-safe; no browser globals |
| IE 11 | ❌ | Not supported; ESM-only build |

Additional notes on the page:
- `String.prototype.toLowerCase()` (not locale variant) is used for case-insensitive matching — intentional for SSR hydration stability.
- `RegExp.escape()` detection is runtime; no build-time polyfill needed.
- The `escape-string-regexp` fallback path is exercised automatically when native `RegExp.escape` is absent.

---

## Technical architecture

### Repo layout

```
docs/
  site/                        ← new Docusaurus site
    docusaurus.config.ts
    sidebars.ts
    src/
      components/
        LiveDemo/
          index.tsx            ← wraps examples from examples/playground/src/
          BasicDemo.tsx
          MultiStateDemo.tsx
          RenderPropDemo.tsx
          HeadlessDemo.tsx
      pages/
        index.tsx              ← landing/redirect to docs
    docs/
      getting-started/
        intro.md
        installation.md
        quick-start.md
      guides/
        basic-highlighting.mdx
        multi-state-styling.mdx
        headless-hook.mdx
        render-prop.mdx
      api/
        highlight-props.mdx
        use-highlight.mdx
        match-builders.mdx
        types.mdx
      recipes/
        diacritic-insensitive.md
        browser-support.md
        overlap-strategies.mdx
    static/
    package.json
  ROADMAP.md
  superpowers/
    specs/
      2026-05-11-docs-site-design.md  ← this file

examples/
  playground/                  ← unchanged; demo components are imported by LiveDemo/
```

### `<LiveDemo>` component

A thin wrapper React component living in `docs/site/src/components/LiveDemo/`. Each demo variant (BasicDemo, MultiStateDemo, etc.) is extracted from the existing `examples/playground/src/App.tsx` into its own file and imported both by:
- The Docusaurus `<LiveDemo>` wrapper (for inline guide page embeds)
- The standalone playground page at `examples/playground/src/App.tsx` (unchanged public Vite app)

This avoids duplicating demo code — the playground app and the docs site share the same demo components via the `workspace:*` monorepo link.

### Vercel deployment

`vercel.json` is updated:

```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter one-more-highlight-docs build",
  "outputDirectory": "docs/site/build"
}
```

The `one-more-highlight-docs` package is the new Docusaurus workspace package at `docs/site/`. The existing playground (`examples/playground/`) is no longer the Vercel root — it becomes a dev-only workspace.

### pnpm workspace

`pnpm-workspace.yaml` already includes `examples/*`. Add `docs/site` as a workspace member.

---

## Node version

`.nvmrc` added to repo root pinning Node **24.15.0** (current LTS/stable). The GitHub Actions workflow and Vercel build will both pick this up automatically.

---

## What does NOT change

- `src/` library code — untouched
- `tests/` — untouched
- `examples/playground/` structure — the Vite app continues to work standalone (`pnpm --filter one-more-highlight-playground dev`)
- CI workflow — `pnpm verify` still runs the library's typecheck/test/build/lint pipeline unchanged
- README — stays in the repo; eventually the API reference section can note "full docs at [url]" but that's a separate docs-only commit

---

## Success criteria

- `pnpm --filter one-more-highlight-docs build` produces a static site with no errors
- All five nav sections are present and navigable
- Each guide page renders its `<LiveDemo>` component without errors
- Browser support recipe page exists with the matrix table
- Vercel deploys successfully on push to `main`
- `pnpm verify` (library checks) still passes unchanged
