# CLAUDE.md — `examples/`

AI-assistant guidance for the `examples/` workspace. Read in addition to the
root `CLAUDE.md` and the `tests/visual/README.md` when working here.

## What lives here

```
examples/
└── playground/        Vite + React 19 demo, also the harness for visual tests
    ├── src/
    │   ├── App.tsx              Route table — one route per demo, /dark/<demo> mirrors
    │   ├── Index.tsx            Demo navigator at / and /dark/
    │   ├── ThemeWrapper.tsx     Sets data-theme="dark" on <html> based on path prefix
    │   ├── ThemeToggle.tsx      🌙/☀️ button in each DemoPage header
    │   ├── index.css            All playground CSS, including the --hl-* tokens
    │   └── demos/               One file per demo (BasicDemo, MultiStateDemo, …)
    ├── index.html               Pre-React fallback CSS for the unhydrated state
    └── package.json             depends on one-more-highlight via "^<published-version>"
```

## Conventions

- **Dual route per demo.** Every demo is reachable at both `/<demo>` (light)
  and `/dark/<demo>` (dark). `ThemeWrapper` keys off the URL prefix, so dark
  mode is shareable as a URL — no client-side state. Adding a new demo means
  adding both routes via the `demos` array in `App.tsx`.
- **Published-version dependency, locally linked.** The playground depends on
  `"one-more-highlight": "^<version>"` — the *published* npm range, not
  `workspace:*` — so external playground environments (CodeSandbox, etc.)
  can install it. Locally, `pnpm-workspace.yaml` sets
  `linkWorkspacePackages: true` + `preferWorkspacePackages: true`, so pnpm
  symlinks the workspace lib whenever its version matches the range. Rebuild
  the library (`pnpm build` at repo root) after changing source; Vite picks
  up the new `dist/` via the symlink without a restart.
- **Release auto-sync.** `scripts/sync-playground-version.mjs` rewrites the
  range to `^${rootVersion}` during the semantic-release `prepare` step
  (see `.releaserc.json`). Don't hand-bump the playground dep — let the
  release pipeline do it so it always tracks the just-published version.
- **CSS tokens.** All highlight colors come from `--hl-*` variables in
  `index.css` (see root CLAUDE.md for the token list). Don't hardcode hex
  values inside demo `.tsx` files — reach for `var(--hl-yellow)` etc.
- **`data-testid="demo"` boundary.** Every demo renders inside a
  `<div data-testid="demo">` (set by `DemoPage`). Playwright specs locate
  this element for screenshots, so demos must stay inside it.

## When adding a new demo

1. Create `src/demos/<Name>Demo.tsx`. Match the conventions of the closest
   existing demo.
2. Add a row to the `demos` array in `App.tsx` — both light and dark routes
   come from one entry.
3. The Index page picks up new demos automatically from that array.
4. **Add a Playwright spec** at `tests/visual/specs/<name>.spec.ts`
   (mirror an existing spec — `goto` both `/<name>` and `/dark/<name>`).
5. Run `pnpm test:visual:update` to seed baselines for all 5 projects
   (chromium, firefox, webkit, mobile-iphone, mobile-android).
6. Commit the new component, the spec, and the 10 new baseline PNGs together.

## When changing existing demo styling

- If the change affects rendered output, run `pnpm test:visual:update` and
  commit the regenerated snapshots.
- Always re-run `pnpm test:visual` after the regen to confirm the new
  baselines are stable.

## What NOT to do

- ❌ Don't import the library via a relative path — use `from 'one-more-highlight'`
  so the workspace symlink stays the source of truth.
- ❌ Don't add new CSS color tokens without also adding them to `docs/site/`
  CSS — the two are intentionally kept in sync (see commit history).
- ❌ Don't add styling that depends on user-agent defaults — Playwright
  specs run in clean profiles and may diverge from your browser.
