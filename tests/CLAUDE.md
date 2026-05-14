# CLAUDE.md — `tests/`

AI-assistant guidance for the `tests/` workspace. Read in addition to the
root `CLAUDE.md`.

## What lives here

```
tests/
├── *.test.{ts,tsx}      Vitest suites — one file per src module
├── ssr.test.tsx         renderToString determinism check
├── fuzz.test.ts         fast-check property tests (1000 iters in CI, 5000 locally)
└── visual/              Playwright visual regression — see tests/visual/README.md
    ├── playwright.config.ts
    ├── specs/           One spec per demo route in the playground
    └── snapshots/       Committed baselines, one PNG per spec × project
```

## Conventions

- **One test file per src module.** `tests/findMatches.test.ts` covers
  `src/findMatches.ts`, and so on. Don't merge unrelated suites.
- **Property-based tests live in `fuzz.test.ts`.** Use `fast-check` for any
  matcher or chunk-pipeline change. The invariant
  `joined(segments) === input` must always hold.
- **SSR tests live in `ssr.test.tsx`.** Any change to rendering must keep
  `renderToString` output stable across runs (no `Math.random`/`Date.now`
  in keys, no DOM access in the matching pipeline).
- **Visual tests are a separate workflow.** See `tests/visual/README.md`
  for scripts, the 5-project device matrix, and the baseline workflow.

## When to update what

| Change kind | Update which tests? |
| --- | --- |
| New `src/` pure function | New `<name>.test.ts` covering happy + edge + failure |
| Change to `findMatches` / `combineChunks` / `applyStates` | Add a `fuzz.test.ts` case before the implementation diff |
| Change to `<Highlight>` rendering | `Highlight.test.tsx` + `ssr.test.tsx` + regenerate visual snapshots |
| Change to `useHighlight` | `useHighlight.test.tsx` + check ssr if SSR-relevant |
| New demo in playground | New spec in `visual/specs/` + regen baselines for all 5 projects |
| Styling change in playground or docs | Regen visual baselines — `pnpm test:visual:update` |

## Running

| Command | When |
| --- | --- |
| `pnpm test` | Always before a commit — full Vitest suite |
| `pnpm test:watch` | Iterating on a unit test |
| `pnpm test -- fuzz` | Stress-test the matcher (use `numRuns: 5000` locally) |
| `pnpm test:visual` | Before committing a visual change |
| `pnpm test:visual:update` | After a visual change, to refresh baselines |

## What NOT to do

- ❌ Don't `--no-verify` past a failing hook to commit. Fix the underlying issue.
- ❌ Don't gitignore visual snapshot PNGs — they're committed binaries, the
  source of truth for visual regression.
- ❌ Don't widen `maxDiffPixelRatio` to hide a real visual regression. Diff
  the PNGs and find the cause first.
- ❌ Don't add Jest, Mocha, or another test runner. Vitest is the contract.
