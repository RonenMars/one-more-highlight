# CLAUDE.md — `one-more-highlight`

Project-specific guidance for AI coding assistants (Claude Code, Cursor, etc.) working on this repository.

## What this project is

A small, focused, TypeScript-first React library for highlighting substrings in text — with first-class support for **multi-state per-match styling** (every match in one style, specific occurrences layered on by single index, range, or arbitrary list).

It is *not*: a full-text search engine, a syntax highlighter (like Prism), an HTML renderer, or a Markdown parser. Reject scope creep aggressively.

## Core principles

These come from the project's design conversation. They override generic "best practice" defaults.

### 1. Smallest diff that solves the problem
- Don't add features, abstractions, or error handling beyond what was asked.
- Don't reformat adjacent code, rename unrelated variables, or "improve" comments you didn't write.
- Match existing style even if you'd do it differently.
- If you notice unrelated dead code, *mention* it — don't act on it.

### 2. No new runtime dependencies without discussion
- The package's pitch is "tiny + auditable" (~2KB brotlied, 2 micro-deps).
- Adding a runtime dep means: explicit user approval, MIT/permissive license check, weekly-download/maintainer-trust audit, and an entry in `CHANGELOG.md`.
- Inlining a Stack Overflow snippet for a common operation is *worse* than taking a trusted dep — see the regex-escape footgun. Use established packages (`escape-string-regexp`, `clsx`) over hand-rolled.
- Dev dependencies have a lower bar but every one earns its slot.

### 3. Strict TypeScript, no `any`
- `tsconfig.json` runs with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- `unknown` + narrowing is fine. `any` is not.
- Discriminated unions (e.g. `HighlightState`) are the canonical way to express "exactly one of these shapes."
- Helper builders (`match.one/range/many`) exist to make discriminated unions ergonomic — when adding new selector forms, add a builder too.

### 4. SSR-safe by default
- No `window`, `document`, or `globalThis` reads in the matching pipeline.
- No `Math.random`, `Date.now`, or non-deterministic IDs in render output.
- Keys derive from `${start}-${end}-${matchIndex}` — stable across server/client.
- `String.prototype.toLowerCase()` (not the locale variant) — locale-dependent matching breaks hydration.

### 5. Comments only when WHY is non-obvious
- Don't explain *what* well-named code already says.
- Don't reference current tasks ("added for issue #123") — that belongs in commit messages and PR descriptions.
- Reasonable comment: a one-line `// Firefox: lastIndex must advance manually here when match.length === 0` next to a workaround.

### 6. Surgical changes — every changed line traces to the request
- This rule comes from prior trauma. AI tools love to "improve" files: rename variables, reformat, move code blocks. The result is unreadable diffs.
- When fixing a bug, fix only that bug. When adding a feature, add only that feature.
- Clean up *your own* mess (imports/variables your changes orphaned). Leave pre-existing dead code alone unless asked.

## Architecture (current — v0.1)

```
src/
├── types.ts          All exported TS types. Discriminated unions live here.
├── escapeRegex.ts    Native-first RegExp.escape() adapter; falls back to escape-string-regexp.
├── findMatches.ts    Raw match collection (string + RegExp). Uses String.prototype.matchAll.
├── combineChunks.ts  Three overlap strategies: merge | nest | first-wins. Pure function.
├── applyStates.ts    Tags each match with the names of states that select it. Dev warnings.
├── buildSegments.ts  Walks tagged chunks → alternating Segment[] covering full text.
├── match.ts          match.one / match.range / match.many — typed selector builders.
├── useHighlight.ts   The hook. useMemo with structural search-key + states-key. SSR-safe.
├── Highlight.tsx     The component. Default <mark>, role=mark fallback, render-prop.
└── index.ts          Public re-exports.
```

**Pipeline**: `findMatches` → `combineChunks(strategy)` → `applyStates(states)` → `buildSegments` → React render (or hook return).

Each pure function is independently testable; tests in `tests/` mirror this structure 1-to-1.

## Doing common tasks

### For every change — keep demos, tests, and snapshots in sync

The library, the playground, the docs site, and the test suite are tightly
coupled. A change in one usually obliges a change in another:

| If you change… | Also update… |
| --- | --- |
| Library source affecting public API | A test in `tests/` + the relevant playground demo + the matching docs `LiveDemo`/guide |
| Library source affecting rendering | The above + regenerate visual snapshots (`pnpm test:visual:update`) |
| Playground demo styling | Visual snapshots for that demo |
| `examples/playground/src/index.css` (tokens, classes) | `docs/site/src/css/custom.css` to keep them in sync + visual snapshots |
| Anything visual | `pnpm test:visual` must be green before committing |

See `tests/visual/README.md` for the snapshot workflow and the 5-project
device matrix (desktop chromium/firefox/webkit + mobile-iphone +
mobile-android).

### Adding a new prop to `<Highlight>`
1. Add the typed prop to `HighlightProps` in `src/types.ts`. Use `?:` (optional) unless it's truly required.
2. Thread it through `Highlight.tsx`. If it affects matching, plumb it through `UseHighlightOptions` and `useHighlight`.
3. Add a test in `tests/Highlight.test.tsx` (component-level) and/or `tests/useHighlight.test.tsx` (hook-level).
4. Update `README.md` props table.
5. `pnpm verify` must be green.

### Changing the matcher
1. Property-based test first. Add to `tests/fuzz.test.ts` if not already covered.
2. Modify `src/findMatches.ts`. Keep the `defaultFindChunks` signature stable — it's a public escape hatch.
3. Run `pnpm test -- fuzz` with `numRuns: 5000` locally to stress-test before pushing.

### Adding a new overlap strategy
1. Extend `OverlapStrategy` in `src/types.ts`.
2. Add a `combine<Strategy>` helper in `src/combineChunks.ts`. Add a switch case.
3. Cover with tests in `tests/combineChunks.test.ts`.
4. Document the new strategy in `README.md`.

### Adding a new state selector form
1. Extend `HighlightState` discriminated union in `src/types.ts`.
2. Update `selects()` and `highestSelected()` in `src/applyStates.ts`.
3. Add a `match.<form>` builder in `src/match.ts` returning the correctly-narrowed shape.
4. Tests in `tests/applyStates.test.ts`.
5. README example.

## Build & verify

| Command | Purpose |
| --- | --- |
| `pnpm typecheck` | `tsc --noEmit` (covers src + tests via shared tsconfig) |
| `pnpm test` | Vitest run, all suites |
| `pnpm test:watch` | Vitest watch |
| `pnpm test:visual` | Playwright visual regression — desktop ×3 (2× DPR for rendering precision) + mobile-iphone + mobile-android (3× DPR, native viewports). See `tests/visual/README.md`. |
| `pnpm test:visual:update` | Regenerate visual baselines after any rendering change. Commit the PNGs. |
| `pnpm build` | tsup → ESM + CJS + `.d.ts` + `.d.cts` in `dist/` |
| `pnpm lint:pkg` | publint + attw — publish-readiness checks |
| `pnpm size` | size-limit — enforces 3 KB brotlied budget |
| `pnpm verify` | All of the above. **Run before committing.** |

## What NOT to do

- ❌ Add a new runtime dependency without explicit user approval.
- ❌ Mutate consumer-supplied `RegExp` objects (always clone — they have shared `lastIndex`).
- ❌ Use `window` / `document` / `localStorage` in the matching pipeline.
- ❌ Add `Co-Authored-By` trailers in commit messages (Claude or otherwise) — repo policy.
- ❌ Refactor or reformat code unrelated to the current task.
- ❌ Add CSS files, Tailwind config, or styling opinions — the package is 100% unstyled by design.
- ❌ Match in code units when the user clearly needs graphemes — instead, document the limitation and direct them to the `sanitize` / `findChunks` escape hatches. Grapheme support is a v2 roadmap item.

## When uncertain — ask

If a request is ambiguous between two reasonable interpretations, ask a concise multiple-choice question rather than guessing. The user values precision over speed.

## License

MIT © Ronen Mars. AI assistant contributions are governed by the same license — there is no separate AI-author attribution.
