# Contributing to one-more-highlight

Thanks for your interest. This is a small, focused library — the bar for new features is "does it earn its keep?" — but bug reports, edge-case fuzz cases, and docs improvements are always welcome.

## Quick start

```bash
git clone git@github.com:RonenMars/one-more-highlight.git
cd one-more-highlight
pnpm install
pnpm verify   # typecheck + tests + build + publint + attw + size-limit
```

To run the playground:

```bash
pnpm build
cd examples/playground
pnpm install
pnpm dev
```

## Project layout

```
src/                  Library source
  types.ts            All exported TS types (discriminated unions live here)
  escapeRegex.ts      Native-first RegExp.escape() adapter
  findMatches.ts      Raw match collection (string + RegExp)
  combineChunks.ts    Overlap strategies: merge | nest | first-wins
  applyStates.ts      Per-match state-name tagging
  buildSegments.ts    Alternating Segment[] construction
  match.ts            match.one / match.range / match.many builders
  useHighlight.ts     The hook (memoized, SSR-safe)
  Highlight.tsx       The component (default <mark>, render-prop, role fallback)
  index.ts            Public exports
tests/                Vitest suites — one file per src module + ssr + fuzz
tests/visual/         Playwright visual regression — see tests/visual/README.md
examples/playground/  Vite + React 19 demo
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm typecheck` | `tsc --noEmit` against `tsconfig.json` (covers src + tests) |
| `pnpm test` | `vitest run` — all suites including 1000-iter fuzz |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:visual` | Playwright visual regression against committed baselines |
| `pnpm test:visual:update` | Regenerate visual baselines — run after any visual change |
| `pnpm test:visual:ui` | Open Playwright UI for interactive snapshot debugging |
| `pnpm build` | `tsup` → ESM + CJS + `.d.ts` + `.d.cts` in `dist/` |
| `pnpm lint:pkg` | `publint` + `attw --pack .` (publish-time package linting) |
| `pnpm size` | `size-limit` — fails the build if bundles exceed 3 KB brotlied |
| `pnpm verify` | All of the above in sequence — run before opening a PR |

## Development workflow

1. **Branch off `main`.** Use a descriptive branch name (`fix-overlap-edge-case`, `add-grapheme-support`).
2. **Write a failing test first.** Every behavior change should be reproducible from a test in `tests/`.
3. **Make the change in the smallest possible diff.** See "Coding standards" below.
4. **Run `pnpm verify`** until it's green. For visual changes, also run
   `pnpm test:visual:update` and commit the regenerated snapshots — the
   release job in CI is blocked by visual regression. See
   [`tests/visual/README.md`](./tests/visual/README.md).
5. **Use conventional commit format** — `fix:` for patches, `feat:` for minor additions, `feat!:` or `BREAKING CHANGE:` footer for majors. semantic-release reads these to determine the version bump automatically. commitlint enforces the format on every local commit via husky.

   **Scope your commit to control whether it ships:** changes outside the library
   (playground, docs site, visual tests, workspace config) must use a scope that
   is configured as no-release in `.releaserc.json`:

   | Scope | Path | Triggers release? |
   | --- | --- | --- |
   | (no scope) or `(src)` | `src/` | yes |
   | `(playground)` | `examples/playground/` | no |
   | `(docs)` | `docs/site/` | no |
   | `(visual)` | `tests/visual/` | no |
   | `(workspaces)` | nested CLAUDE.md / workspace config | no |

   So a playground tweak is `chore(playground): …` or `feat(playground): …` and
   will NOT bump the package version. A library bug fix is `fix: …` and WILL
   trigger a patch release.
6. **Open a PR** with a clear description of *why*, not just *what*.

## Coding standards

- **Surgical changes only.** Don't refactor adjacent code, reformat unrelated files, or "improve" things that aren't broken. Every changed line should trace back to the issue you're solving.
- **No new runtime dependencies** without discussion. The whole pitch is "tiny + auditable."
- **Strict TypeScript, no `any`.** `unknown` + narrowing is fine; `any` is not. If TS is fighting you, ask in the PR rather than escape-hatching.
- **No comments unless they explain *why*.** Names should explain *what*. Comments are for non-obvious constraints, surprising invariants, or workarounds.
- **SSR-safe by default.** No `window`/`document` reads in the matching pipeline, no `Math.random`/`Date.now` in keys.

## Testing requirements

- **Unit tests** for any new pure function. Cover the happy path, an edge case, and at least one failure mode.
- **Component tests** (RTL) for any change to `<Highlight>` rendering.
- **Fuzz tests** (`fast-check`) when changing the matcher or chunk pipeline. The invariant `joined(segments) === input` must always hold.
- **SSR snapshot test** when changing rendering — `renderToString` must be deterministic.

## Reporting bugs

A useful bug report includes:

1. The exact `text`, `searchWords`, and `states` that reproduce.
2. What you expected to happen.
3. What actually happened.
4. Browser / Node version (if relevant).
5. Ideally, a failing test case in the format of the existing test suite.

## Feature requests

Open an issue first. If it's on the v2 roadmap (see [`docs/ROADMAP.md`](./docs/ROADMAP.md)), we can talk timing. If it's not, make the case for why it earns its place — a small library only stays small if every feature is justified.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
