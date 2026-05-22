# Per-search-term Indexing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new selector forms to `HighlightState` — `{ term, … }` and `{ term, nth, … }` — so consumers can address matches per search term rather than by global match index. Stable references for autocomplete UIs where `searchWords` changes dynamically.

**Architecture:** Extend the existing discriminated union in `src/types.ts` with two new members keyed by the presence of a `term` field. Thread `searchWords` into `applyStates`, where a small per-state pre-pass resolves `term` → set of `termIndex` values, optionally filters by `nth` in document order, and tags chunks. Reuse the existing `WeakSet<states>`-guarded dev warning path; add three new warning messages controllable via per-state `silent: true`. Update the `useMemo` dependency key in `useHighlight` to serialize the new fields. Add one playground demo + visual spec + docs page entries. Zero new runtime dependencies; well under 100 bytes brotlied impact.

**Tech Stack:** TypeScript (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes), React 18+, Vitest, Playwright (visual), pnpm, tsup, Docusaurus, semantic-release.

**Spec:** `docs/superpowers/specs/2026-05-22-per-search-term-indexing-design.md`

---

## File Map

| File | Action | Responsibility |
| --- | --- | --- |
| `src/types.ts` | Modify | Add `HighlightStateTerm`, `HighlightStateTermNth`; widen `HighlightState` union. |
| `src/applyStates.ts` | Modify | Extend `selects()`, `highestSelected()`, `maybeWarnOutOfRange()`. Add `resolveTermIndices()`. Thread `searchWords` through `applyStates()`. |
| `src/useHighlight.ts` | Modify | Pass `searchWords` to `applyStates`. Extend `statesKeyOf()` to serialize new fields. |
| `tests/applyStates.test.ts` | Modify | Add cases for `term`/`nth`/`termMatch`/`silent` + composition. |
| `tests/useHighlight.test.tsx` | Modify | Verify memo key invalidates on new fields. |
| `tests/Highlight.test.tsx` | Modify | End-to-end render: right classes on right matches. |
| `tests/fuzz.test.ts` | Modify | One property: every chunk tagged by `{ term: i }` has `termIndex === i`. |
| `examples/playground/src/demos/PerTermDemo.tsx` | Create | Demo showing per-term selectors + `nth`. |
| `examples/playground/src/App.tsx` | Modify | Add `per-term` row to demos array (both light + dark routes). |
| `tests/visual/specs/per-term.spec.ts` | Create | Visual spec for the new demo route. |
| `tests/visual/snapshots/per-term.spec.ts/*` | Create | 10 baseline PNGs (5 projects × light/dark). Generated, not hand-written. |
| `docs/site/docs/api/highlight-state-selectors.md` | Modify | New section: per-search-term selectors with worked examples. |
| `docs/site/docs/guides/multi-state-styling.md` | Modify | Add autocomplete-stability example block. |
| `README.md` | Modify | Update `HighlightState` shape table + one-line example. |
| `docs/ROADMAP.md` | Modify | Move "Per-search-term match indexing" from v1.0 candidates → Shipped (under v0.5 or current pre-release line). |

---

## Conventions for every task

- **TDD always.** Write the failing test first; run it; confirm it fails for the *right* reason; implement the minimum to pass; re-run; commit.
- **Commit titles** use the project's conventional-commit rules. Library-affecting changes are `feat:` / `fix:`. Demo-only changes are `chore(playground):` (no version bump). Docs are `docs:` (no bump). Visual snapshots are `chore(visual):` (no bump). See root `CLAUDE.md` "Commit conventions" table.
- **No `--no-verify`.** Husky runs lint + typecheck on every commit. If a hook fails, fix the cause.
- **No co-author trailer.** Repo policy.
- **`pnpm verify` is the final gate** before the last commit. Run it; it must be green.

---

### Task 1: Add the new union members to `HighlightState`

**Files:**
- Modify: `src/types.ts:28-38`

- [ ] **Step 1: Write the failing test (compile-time)**

Add this test at the **top** of `tests/applyStates.test.ts` (above the existing `describe` block — it will fail to compile until the union is extended):

```ts
import { describe, expect, it } from 'vitest';
import { applyStates } from '../src/applyStates.js';
import type { CombinedChunk } from '../src/combineChunks.js';
import type { HighlightState } from '../src/types.js';

// Type-level smoke test: the new shapes must be assignable to HighlightState.
// If this file no longer compiles, the union is missing the new members.
const _termShape: HighlightState = { name: 't', term: 'cat' };
const _termNthShape: HighlightState = { name: 'tn', term: 0, nth: 2 };
const _termAllShape: HighlightState = {
  name: 'ta',
  term: 'cat',
  termMatch: 'all',
};
const _termSilent: HighlightState = { name: 'ts', term: 'cat', silent: true };
void _termShape;
void _termNthShape;
void _termAllShape;
void _termSilent;
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `pnpm typecheck`
Expected: FAIL with errors about properties `term`, `nth`, `termMatch`, `silent` not being assignable to `HighlightState`.

- [ ] **Step 3: Extend the union in `src/types.ts`**

Replace the existing block at lines 28-38 with:

```ts
export type HighlightStateBase = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

export type HighlightStateOne = HighlightStateBase & { index: number };
export type HighlightStateRange = HighlightStateBase & { range: readonly [number, number] };
export type HighlightStateMany = HighlightStateBase & { indices: ReadonlyArray<number> };

export type HighlightStateTerm = HighlightStateBase & {
  term: string | number;
  termMatch?: 'all' | 'first';
  silent?: boolean;
};

export type HighlightStateTermNth = HighlightStateBase & {
  term: string | number;
  nth: number;
  termMatch?: 'all' | 'first';
  silent?: boolean;
};

export type HighlightState =
  | HighlightStateOne
  | HighlightStateRange
  | HighlightStateMany
  | HighlightStateTerm
  | HighlightStateTermNth;
```

- [ ] **Step 4: Run typecheck to verify it passes**

Run: `pnpm typecheck`
Expected: PASS (no errors).

- [ ] **Step 5: Run existing tests to confirm no regression**

Run: `pnpm test`
Expected: All existing suites still PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts tests/applyStates.test.ts
git commit -m "feat(src): add term and nth selector shapes to HighlightState union"
```

---

### Task 2: `applyStates` — thread `searchWords` through (signature change only)

This task is a refactor: change the internal `applyStates` signature without yet implementing the new behavior. Tests should still pass.

**Files:**
- Modify: `src/applyStates.ts:41-56`
- Modify: `src/useHighlight.ts:72`
- Modify: `tests/applyStates.test.ts` (existing call sites)

- [ ] **Step 1: Update existing test calls (preview the signature change)**

In `tests/applyStates.test.ts`, every call to `applyStates(chunks, states)` becomes `applyStates(chunks, states, [])` — empty `searchWords` is fine for all existing tests because they don't use term-based selectors yet.

Specifically:
- Line near `const r = applyStates(chunks, undefined);` → `const r = applyStates(chunks, undefined, []);`
- Same pattern for every other `applyStates(chunks, states)` call.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- applyStates`
Expected: FAIL — `applyStates` only takes 2 arguments. TS error.

- [ ] **Step 3: Update `applyStates` signature**

Replace the `applyStates` function at `src/applyStates.ts:41-56` with:

```ts
export function applyStates(
  chunks: ReadonlyArray<CombinedChunk>,
  states: ReadonlyArray<HighlightState> | undefined,
  searchWords: ReadonlyArray<string | RegExp>,
): TaggedChunk[] {
  if (!states || states.length === 0) {
    return chunks.map((c) => ({ ...c, states: [] }));
  }
  maybeWarnOutOfRange(states, chunks.length);
  return chunks.map((c) => {
    const names: string[] = [];
    for (const s of states) {
      if (selects(s, c.matchIndex)) names.push(s.name);
    }
    return { ...c, states: names };
  });
}
```

(`searchWords` is unused for now — TS may complain. If your tsconfig flags unused parameters, prefix with `_` temporarily: `_searchWords`. Task 4 will use it.)

- [ ] **Step 4: Update the caller in `src/useHighlight.ts:72`**

Replace:

```ts
const tagged = applyStates(combined, states);
```

with:

```ts
const tagged = applyStates(combined, states, searchWords);
```

- [ ] **Step 5: Run typecheck + tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS — all existing tests green.

- [ ] **Step 6: Commit**

```bash
git add src/applyStates.ts src/useHighlight.ts tests/applyStates.test.ts
git commit -m "refactor(src): thread searchWords into applyStates"
```

---

### Task 3: `term: number` resolves to a single `searchWords` index

**Files:**
- Modify: `tests/applyStates.test.ts`
- Modify: `src/applyStates.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/applyStates.test.ts` inside the existing `describe('applyStates', …)`:

```ts
it('tags by numeric term — selects matches whose termIndex equals state.term', () => {
  // chunks 0/2 are termIndex 0; chunks 1/3 are termIndex 1.
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
    { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
    { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
    { start: 15, end: 18, termIndex: 1, matchIndex: 3 },
  ];
  const states: HighlightState[] = [{ name: 'first-term', term: 0 }];
  const r = applyStates(mixed, states, ['cat', 'dog']);
  expect(r[0]?.states).toEqual(['first-term']);
  expect(r[1]?.states).toEqual([]);
  expect(r[2]?.states).toEqual(['first-term']);
  expect(r[3]?.states).toEqual([]);
});

it('numeric term out of range — silent no-op with warning suppressed via silent', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const states: HighlightState[] = [{ name: 'oops', term: 9, silent: true }];
  const r = applyStates(chunks, states, ['cat']);
  expect(r.every((c) => c.states.length === 0)).toBe(true);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('numeric term out of range — warns by default', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const states: HighlightState[] = [{ name: 'oops', term: 9 }];
  applyStates(chunks, states, ['cat']);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toMatch(/term index 9 .* out of range/i);
  warn.mockRestore();
});
```

Also add `vi` to the imports at the top:

```ts
import { describe, expect, it, vi } from 'vitest';
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `pnpm test -- applyStates`
Expected: FAIL with messages indicating the term selector did nothing (states arrays empty when they should be tagged), or that the warning didn't fire.

- [ ] **Step 3: Implement `resolveTermIndices` + extend `selects`/`highestSelected`**

Edit `src/applyStates.ts`. After the existing imports and before `selects`, add:

```ts
function resolveTermIndices(
  state: HighlightState,
  searchWords: ReadonlyArray<string | RegExp>,
): { indices: number[]; reason: 'ok' | 'unknown' } {
  if (!('term' in state)) return { indices: [], reason: 'ok' };
  if (typeof state.term === 'number') {
    if (state.term < 0 || state.term >= searchWords.length) {
      return { indices: [], reason: 'unknown' };
    }
    return { indices: [state.term], reason: 'ok' };
  }
  // string form
  const match = (w: string | RegExp): boolean => typeof w === 'string' && w === state.term;
  if (state.termMatch === 'first') {
    const i = searchWords.findIndex(match);
    return i === -1 ? { indices: [], reason: 'unknown' } : { indices: [i], reason: 'ok' };
  }
  const all: number[] = [];
  searchWords.forEach((w, i) => {
    if (match(w)) all.push(i);
  });
  return all.length === 0
    ? { indices: [], reason: 'unknown' }
    : { indices: all, reason: 'ok' };
}
```

Replace the existing `selects` function with:

```ts
function selects(state: HighlightState, matchIndex: number): boolean {
  if ('index' in state) return state.index === matchIndex;
  if ('range' in state) {
    const [lo, hi] = state.range;
    return matchIndex >= lo && matchIndex <= hi;
  }
  if ('indices' in state) return state.indices.includes(matchIndex);
  // term-based selectors are handled by pre-pass in applyStates; never inline.
  return false;
}
```

(`highestSelected` still doesn't need to know about term-based selectors yet — we'll keep the out-of-range "global match index" warning behavior unchanged for them.)

Now replace the `applyStates` body so it pre-resolves term selectors:

```ts
export function applyStates(
  chunks: ReadonlyArray<CombinedChunk>,
  states: ReadonlyArray<HighlightState> | undefined,
  searchWords: ReadonlyArray<string | RegExp>,
): TaggedChunk[] {
  if (!states || states.length === 0) {
    return chunks.map((c) => ({ ...c, states: [] }));
  }
  maybeWarnOutOfRange(states, chunks.length);

  // Pre-pass: for each state that has a `term`, resolve to a set of matchIndices.
  const termSelections = new Map<HighlightState, Set<number>>();
  for (const s of states) {
    if (!('term' in s)) continue;
    const resolved = resolveTermIndices(s, searchWords);
    if (resolved.reason === 'unknown') {
      maybeWarnUnknownTerm(s, states);
      termSelections.set(s, new Set());
      continue;
    }
    const termSet = new Set(resolved.indices);
    const candidates = chunks
      .filter((c) => termSet.has(c.termIndex))
      .slice()
      .sort((a, b) => a.start - b.start || a.end - b.end);
    termSelections.set(s, new Set(candidates.map((c) => c.matchIndex)));
  }

  return chunks.map((c) => {
    const names: string[] = [];
    for (const s of states) {
      if ('term' in s) {
        if (termSelections.get(s)?.has(c.matchIndex)) names.push(s.name);
      } else if (selects(s, c.matchIndex)) {
        names.push(s.name);
      }
    }
    return { ...c, states: names };
  });
}
```

Add the new warning helper (`maybeWarnUnknownTerm`). After `maybeWarnOutOfRange`, add:

```ts
function maybeWarnUnknownTerm(
  state: HighlightStateTerm | HighlightStateTermNth,
  states: ReadonlyArray<HighlightState>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if ('silent' in state && state.silent) return;
  if (warned.has(states)) return;
  if (typeof state.term === 'number') {
    console.warn(
      `[one-more-highlight] state "${state.name}" references term index ${state.term} which is out of range of searchWords.`,
    );
  } else {
    console.warn(
      `[one-more-highlight] state "${state.name}" references term "${state.term}" which is not present in searchWords.`,
    );
  }
  warned.add(states);
}
```

At the top of `src/applyStates.ts`, update the import to bring in the new types:

```ts
import type {
  HighlightState,
  HighlightStateTerm,
  HighlightStateTermNth,
} from './types.js';
```

`HighlightStateTerm` and `HighlightStateTermNth` must be exported from `src/types.ts` — verify they were exported as part of Task 1 (they were — they're `export type` declarations).

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `pnpm test -- applyStates`
Expected: PASS — all tests green, including new ones.

⚠️ Watch for: the `warned` `WeakSet` is shared across the two warning helpers. If you write a test that triggers an unknown-term warning AND an out-of-range warning on the same `states` array, only the first one fires. That is intentional (one warning per array per render is the existing contract). The "silent suppression" test uses a fresh states array, so it's unaffected.

- [ ] **Step 5: Commit**

```bash
git add src/applyStates.ts tests/applyStates.test.ts
git commit -m "feat(src): support numeric term selector with out-of-range warning"
```

---

### Task 4: `term: string` with `termMatch: 'all' | 'first'`

**Files:**
- Modify: `tests/applyStates.test.ts`

(The implementation already supports the string form — `resolveTermIndices` was written generically in Task 3. This task is pure test coverage with one additional unknown-term warning test for the string variant.)

- [ ] **Step 1: Write the failing test**

Append to `tests/applyStates.test.ts`:

```ts
it('tags by string term — matches every entry equal to term (default termMatch: all)', () => {
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 },  // 'cat' (first entry)
    { start: 5, end: 8, termIndex: 1, matchIndex: 1 },  // 'dog'
    { start: 10, end: 13, termIndex: 2, matchIndex: 2 }, // 'cat' (third entry)
    { start: 15, end: 18, termIndex: 1, matchIndex: 3 }, // 'dog'
  ];
  const states: HighlightState[] = [{ name: 'cat-state', term: 'cat' }];
  const r = applyStates(mixed, states, ['cat', 'dog', 'cat']);
  expect(r[0]?.states).toEqual(['cat-state']);
  expect(r[1]?.states).toEqual([]);
  expect(r[2]?.states).toEqual(['cat-state']);
  expect(r[3]?.states).toEqual([]);
});

it('termMatch: "first" binds string term to only the first matching entry', () => {
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 },  // 'cat' (first)
    { start: 10, end: 13, termIndex: 2, matchIndex: 1 }, // 'cat' (third)
  ];
  const states: HighlightState[] = [
    { name: 'first-cat', term: 'cat', termMatch: 'first' },
  ];
  const r = applyStates(mixed, states, ['cat', 'dog', 'cat']);
  expect(r[0]?.states).toEqual(['first-cat']);
  expect(r[1]?.states).toEqual([]);
});

it('string term does NOT match RegExp entries even when source equals term', () => {
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 }, // 'cat' (string)
    { start: 5, end: 8, termIndex: 1, matchIndex: 1 }, // /cat/ (regex; source === 'cat')
  ];
  const states: HighlightState[] = [{ name: 'literal-cat', term: 'cat' }];
  const r = applyStates(mixed, states, ['cat', /cat/]);
  expect(r[0]?.states).toEqual(['literal-cat']);
  expect(r[1]?.states).toEqual([]);
});

it('unknown string term warns by default and is silent with silent: true', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  applyStates(chunks, [{ name: 'missing', term: 'zzz' }], ['cat']);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toMatch(/term "zzz" .* not present/i);
  warn.mockClear();

  applyStates(chunks, [{ name: 'missing', term: 'zzz', silent: true }], ['cat']);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
```

- [ ] **Step 2: Run tests to verify they pass (mostly)**

Run: `pnpm test -- applyStates`
Expected: PASS — the implementation from Task 3 already handles all four cases.

If any test fails, the failure mode tells you the bug. Stop and fix in `src/applyStates.ts` before continuing.

- [ ] **Step 3: Commit**

```bash
git add tests/applyStates.test.ts
git commit -m "test(src): cover string-term selector and termMatch first/all"
```

---

### Task 5: `nth` picks a specific occurrence in document order

**Files:**
- Modify: `tests/applyStates.test.ts`
- Modify: `src/applyStates.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/applyStates.test.ts`:

```ts
it('nth selects the Nth occurrence of a term in document order (0-indexed)', () => {
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
    { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
    { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
    { start: 15, end: 18, termIndex: 0, matchIndex: 3 },
  ];
  // term 0 has three matches: matchIndices [0, 2, 3] in doc order.
  const r0 = applyStates(mixed, [{ name: 'n0', term: 0, nth: 0 }], ['cat', 'dog']);
  expect(r0[0]?.states).toEqual(['n0']);
  expect(r0[2]?.states).toEqual([]);
  expect(r0[3]?.states).toEqual([]);

  const r1 = applyStates(mixed, [{ name: 'n1', term: 0, nth: 1 }], ['cat', 'dog']);
  expect(r1[0]?.states).toEqual([]);
  expect(r1[2]?.states).toEqual(['n1']);
  expect(r1[3]?.states).toEqual([]);

  const r2 = applyStates(mixed, [{ name: 'n2', term: 0, nth: 2 }], ['cat', 'dog']);
  expect(r2[3]?.states).toEqual(['n2']);
});

it('nth out of range — warns by default, silent: true suppresses', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  // term 0 has 4 matches; nth: 9 is out of range.
  applyStates(chunks, [{ name: 'over', term: 0, nth: 9 }], ['cat']);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toMatch(/nth: 9 .* only has 4 matches/i);
  warn.mockClear();

  applyStates(
    chunks,
    [{ name: 'over', term: 0, nth: 9, silent: true }],
    ['cat'],
  );
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('nth: -1 is treated as out of range', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const r = applyStates(chunks, [{ name: 'neg', term: 0, nth: -1 }], ['cat']);
  expect(r.every((c) => c.states.length === 0)).toBe(true);
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- applyStates`
Expected: FAIL — `nth` is not yet honored; all four chunks with `termIndex === 0` get tagged regardless of `nth`.

- [ ] **Step 3: Implement `nth` filtering + warning**

In `src/applyStates.ts`, replace the term-pre-pass block inside `applyStates` (the `for (const s of states)` that builds `termSelections`) with:

```ts
const termSelections = new Map<HighlightState, Set<number>>();
for (const s of states) {
  if (!('term' in s)) continue;
  const resolved = resolveTermIndices(s, searchWords);
  if (resolved.reason === 'unknown') {
    maybeWarnUnknownTerm(s, states);
    termSelections.set(s, new Set());
    continue;
  }
  const termSet = new Set(resolved.indices);
  const candidates = chunks
    .filter((c) => termSet.has(c.termIndex))
    .slice()
    .sort((a, b) => a.start - b.start || a.end - b.end);
  if ('nth' in s) {
    if (s.nth < 0 || s.nth >= candidates.length) {
      maybeWarnNthOutOfRange(s, candidates.length, states);
      termSelections.set(s, new Set());
    } else {
      const picked = candidates[s.nth];
      termSelections.set(s, new Set(picked ? [picked.matchIndex] : []));
    }
  } else {
    termSelections.set(s, new Set(candidates.map((c) => c.matchIndex)));
  }
}
```

Add the new warning helper next to the others:

```ts
function maybeWarnNthOutOfRange(
  state: HighlightStateTermNth,
  count: number,
  states: ReadonlyArray<HighlightState>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if (state.silent) return;
  if (warned.has(states)) return;
  const termLabel =
    typeof state.term === 'number' ? `index ${state.term}` : `"${state.term}"`;
  console.warn(
    `[one-more-highlight] state "${state.name}" has nth: ${state.nth} but term ${termLabel} only has ${count} matches.`,
  );
  warned.add(states);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- applyStates`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/applyStates.ts tests/applyStates.test.ts
git commit -m "feat(src): support nth selector for per-term occurrence"
```

---

### Task 6: Composition with existing selectors on the same chunk

**Files:**
- Modify: `tests/applyStates.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/applyStates.test.ts`:

```ts
it('composes term-based and global-index selectors on the same chunk', () => {
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
    { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
    { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
  ];
  const states: HighlightState[] = [
    { name: 'first-global', index: 0 },
    { name: 'cat-all', term: 0 },
    { name: 'cat-first', term: 0, nth: 0 },
    { name: 'middle-range', range: [1, 1] },
  ];
  const r = applyStates(mixed, states, ['cat', 'dog']);
  expect(r[0]?.states).toEqual(['first-global', 'cat-all', 'cat-first']);
  expect(r[1]?.states).toEqual(['middle-range']);
  expect(r[2]?.states).toEqual(['cat-all']);
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test -- applyStates`
Expected: PASS — composition already works because each state is independently checked in the final mapping loop.

If it fails, the failure mode tells you what's wrong. Fix in `src/applyStates.ts`.

- [ ] **Step 3: Commit**

```bash
git add tests/applyStates.test.ts
git commit -m "test(src): cover term selector composition with index and range"
```

---

### Task 7: `useHighlight` memo key serializes the new fields

**Files:**
- Modify: `tests/useHighlight.test.tsx`
- Modify: `src/useHighlight.ts:14-24`

- [ ] **Step 1: Write the failing test**

In `tests/useHighlight.test.tsx`, append a test inside the existing `describe`:

```ts
it('re-computes segments when term / nth / termMatch / silent fields change', () => {
  const { result, rerender } = renderHook(
    ({ states }: { states: HighlightState[] }) =>
      useHighlight({
        text: 'cat dog cat',
        searchWords: ['cat', 'dog'],
        states,
      }),
    { initialProps: { states: [{ name: 'a', term: 0 }] satisfies HighlightState[] } },
  );

  const first = result.current.segments;
  rerender({ states: [{ name: 'a', term: 1 }] satisfies HighlightState[] });
  expect(result.current.segments).not.toBe(first);

  const second = result.current.segments;
  rerender({
    states: [{ name: 'a', term: 1, nth: 0 }] satisfies HighlightState[],
  });
  expect(result.current.segments).not.toBe(second);

  const third = result.current.segments;
  rerender({
    states: [
      { name: 'a', term: 'cat', termMatch: 'first' } satisfies HighlightState,
    ],
  });
  expect(result.current.segments).not.toBe(third);
});
```

If the existing test file doesn't already import `renderHook` and `HighlightState`, add them.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- useHighlight`
Expected: FAIL — `statesKeyOf` doesn't serialize `term`/`nth`/`termMatch`/`silent`, so the memo returns the same `segments` reference even though selectors changed.

(Note: the test asserts referential change of `segments`. If the engine happens to produce identical content for both states, the test still proves the memo invalidated only if the reference is different. The memo key is the only way to make `useMemo` re-run, so a stable reference means the key didn't change → bug.)

- [ ] **Step 3: Extend `statesKeyOf` in `src/useHighlight.ts`**

Replace the function at lines 14-24 with:

```ts
function statesKeyOf(states: ReadonlyArray<HighlightState> | undefined): string {
  if (!states) return '';
  return JSON.stringify(states.map((s) => {
    let sel: unknown;
    if ('index' in s) sel = { i: s.index };
    else if ('range' in s) sel = { r: s.range };
    else if ('indices' in s) sel = { m: s.indices };
    else if ('nth' in s) sel = { t: s.term, n: s.nth, tm: s.termMatch ?? 'all', sl: !!s.silent };
    else sel = { t: s.term, tm: s.termMatch ?? 'all', sl: !!s.silent };
    return [s.name, sel, s.className ?? '', s.style ?? null];
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- useHighlight`
Expected: PASS.

Also run the full suite to make sure nothing else regressed:

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/useHighlight.ts tests/useHighlight.test.tsx
git commit -m "feat(src): serialize term selector fields in useHighlight memo key"
```

---

### Task 8: End-to-end `<Highlight>` render test

**Files:**
- Modify: `tests/Highlight.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `tests/Highlight.test.tsx`, inside the existing `describe`:

```ts
it('applies term-based state class to matches of the right search word', () => {
  const { container } = render(
    <Highlight
      text="cat dog cat"
      searchWords={['cat', 'dog']}
      highlightClassName="hl-base"
      states={[
        { name: 'feline', term: 'cat', className: 'hl-cat' },
        { name: 'canine', term: 'dog', className: 'hl-dog' },
      ]}
    />,
  );
  const marks = container.querySelectorAll('mark');
  // Three matches: 'cat', 'dog', 'cat'.
  expect(marks).toHaveLength(3);
  expect(marks[0]?.className).toContain('hl-cat');
  expect(marks[1]?.className).toContain('hl-dog');
  expect(marks[2]?.className).toContain('hl-cat');
});

it('applies nth state class only to the targeted occurrence', () => {
  const { container } = render(
    <Highlight
      text="cat dog cat dog cat"
      searchWords={['cat', 'dog']}
      highlightClassName="hl-base"
      states={[{ name: 'first-cat', term: 'cat', nth: 0, className: 'hl-first' }]}
    />,
  );
  const marks = container.querySelectorAll('mark');
  expect(marks).toHaveLength(5);
  expect(marks[0]?.className).toContain('hl-first');
  expect(marks[2]?.className).not.toContain('hl-first');
  expect(marks[4]?.className).not.toContain('hl-first');
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm test -- Highlight`
Expected: PASS — the implementation chain from Tasks 1-7 already wires this through.

If a test fails, the failure mode tells you what's broken. Fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add tests/Highlight.test.tsx
git commit -m "test(src): end-to-end Highlight render for term and nth selectors"
```

---

### Task 9: Fuzz property — `term: i` only tags matches with `termIndex === i`

**Files:**
- Modify: `tests/fuzz.test.ts`

- [ ] **Step 1: Read the existing fuzz file**

Run: `cat tests/fuzz.test.ts`

Note the existing pattern — `fast-check` with `fc.property` and an invariant on the joined segments. Match the style.

- [ ] **Step 2: Write the failing test**

Append to `tests/fuzz.test.ts` (inside the existing `describe`):

```ts
it('term: i only tags matches whose underlying termIndex equals i', () => {
  fc.assert(
    fc.property(
      fc.array(fc.stringMatching(/^[a-z]{1,4}$/), { minLength: 1, maxLength: 5 }),
      fc.string({ minLength: 0, maxLength: 200 }),
      fc.nat({ max: 4 }),
      (searchWords, text, termPick) => {
        const t = termPick % searchWords.length;
        const raw = defaultFindChunks({
          searchWords,
          textToHighlight: text,
          caseSensitive: false,
          autoEscape: true,
        });
        const combined = combineChunks(raw, 'merge');
        const tagged = applyStates(
          combined,
          [{ name: 'pick', term: t, silent: true }],
          searchWords,
        );
        for (const c of tagged) {
          if (c.states.includes('pick')) {
            // The tag should only land on chunks whose termIndex === t.
            // With overlap strategy 'merge', termIndex on a surviving chunk is
            // the termIndex of whichever raw match started the merged block.
            expect(c.termIndex).toBe(t);
          }
        }
      },
    ),
    { numRuns: 1000 },
  );
});
```

If `fc`, `defaultFindChunks`, `combineChunks`, `applyStates` aren't already imported in `fuzz.test.ts`, add them.

- [ ] **Step 3: Run the test**

Run: `pnpm test -- fuzz`
Expected: PASS — the invariant holds because Task 3's `resolveTermIndices` is correct.

If it fails, fast-check will print a counterexample. That's a real bug — fix `src/applyStates.ts` before continuing.

- [ ] **Step 4: Commit**

```bash
git add tests/fuzz.test.ts
git commit -m "test(fuzz): assert term selector respects termIndex invariant"
```

---

### Task 10: Playground demo — `PerTermDemo.tsx`

**Files:**
- Create: `examples/playground/src/demos/PerTermDemo.tsx`
- Modify: `examples/playground/src/App.tsx`

- [ ] **Step 1: Inspect existing demo conventions**

Run: `cat examples/playground/src/demos/SelectorsDemo.tsx`
Run: `cat examples/playground/src/App.tsx | head -80`

Match the style.

- [ ] **Step 2: Create the new demo**

Write `examples/playground/src/demos/PerTermDemo.tsx`:

```tsx
import { Highlight } from 'one-more-highlight';

// Scenario: an autocomplete-style UI where the user has typed two queries.
// Each query keeps its own color across re-orderings — that's the whole
// point of term-based selectors versus the global-index forms.
const text = 'A cat sat on the mat. The dog ran past. Another cat watched.';

export function PerTermDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ term: 'cat' } & { term: 'dog' } — color stays with each term`}</small>
        <div>
          <Highlight
            text={text}
            searchWords={['cat', 'dog']}
            highlightClassName="hl-base"
            states={[
              { name: 'cat', term: 'cat', className: 'hl-one' },
              { name: 'dog', term: 'dog', className: 'hl-range' },
            ]}
          />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ term: 'cat', nth: 0 } — first occurrence of 'cat' only`}</small>
        <div>
          <Highlight
            text={text}
            searchWords={['cat', 'dog']}
            highlightClassName="hl-base"
            states={[
              { name: 'first-cat', term: 'cat', nth: 0, className: 'hl-many' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
```

(Class names `hl-base`, `hl-one`, `hl-range`, `hl-many` already exist in `examples/playground/src/index.css` — verify with `grep "hl-many" examples/playground/src/index.css`. If a name is missing, swap to one that exists.)

- [ ] **Step 3: Register the demo in `App.tsx`**

Open `examples/playground/src/App.tsx`. Find the `demos` array (it's a list of objects with `path`, `title`, and `Component`). Add a new entry, alphabetically placed if existing entries are alphabetical:

```tsx
{ path: 'per-term', title: 'Per-search-term', Component: PerTermDemo },
```

Add the matching import at the top of the file with the other demo imports:

```tsx
import { PerTermDemo } from './demos/PerTermDemo';
```

- [ ] **Step 4: Verify it renders locally**

Run: `pnpm --filter playground dev`
Visit `http://localhost:5173/per-term` and `http://localhost:5173/dark/per-term`. Confirm:
- Two paragraph-style blocks.
- First block: `cat` matches in yellow-ish (`hl-one`), `dog` matches in green-ish (`hl-range`).
- Second block: only the first `cat` in pink-ish (`hl-many`).

Stop the dev server (Ctrl-C).

- [ ] **Step 5: Run unit + typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add examples/playground/src/demos/PerTermDemo.tsx examples/playground/src/App.tsx
git commit -m "chore(playground): add per-search-term demo"
```

---

### Task 11: Visual regression spec + baselines

**Files:**
- Create: `tests/visual/specs/per-term.spec.ts`
- Create: `tests/visual/snapshots/per-term.spec.ts/...` (10 PNGs generated by `pnpm test:visual:update`)

- [ ] **Step 1: Read an existing spec to match conventions**

Run: `cat tests/visual/specs/selectors.spec.ts`

- [ ] **Step 2: Create the spec**

Write `tests/visual/specs/per-term.spec.ts`. Mirror the structure of `selectors.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('per-term demo — light', async ({ page }) => {
  await page.goto('/per-term');
  const demo = page.getByTestId('demo');
  await expect(demo).toHaveScreenshot('per-term-light.png');
});

test('per-term demo — dark', async ({ page }) => {
  await page.goto('/dark/per-term');
  const demo = page.getByTestId('demo');
  await expect(demo).toHaveScreenshot('per-term-dark.png');
});
```

If `selectors.spec.ts` uses a different exact shape (different selector for the demo box, or `await page.waitForLoadState`, etc.), mirror that instead.

- [ ] **Step 3: Generate baselines**

Run: `pnpm test:visual:update`
Expected: 10 new PNGs under `tests/visual/snapshots/per-term.spec.ts/` (5 projects × 2 themes).

- [ ] **Step 4: Confirm baselines pass**

Run: `pnpm test:visual`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/visual/specs/per-term.spec.ts tests/visual/snapshots/per-term.spec.ts
git commit -m "chore(visual): add per-term demo snapshots"
```

---

### Task 12: Docs site — API reference + multi-state guide

**Files:**
- Modify: `docs/site/docs/api/highlight-state-selectors.md`
- Modify: `docs/site/docs/guides/multi-state-styling.md`

- [ ] **Step 1: Locate the existing API page**

Run: `cat docs/site/docs/api/highlight-state-selectors.md`

Find the section that lists the three current selector forms (`index`, `range`, `indices`).

- [ ] **Step 2: Add the per-term section**

After the `indices` form section, append:

````markdown
## Per-search-term selectors

When `searchWords` changes dynamically (autocomplete, filter chips, query
refinement), global match indices shift. Per-search-term selectors
address matches by which search word produced them, so references stay
stable across `searchWords` mutations.

### `{ term }` — all matches of a term

```tsx
<Highlight
  text="A cat sat on the mat."
  searchWords={['cat', 'dog']}
  states={[
    { name: 'feline', term: 'cat', className: 'cat-color' },
    { name: 'canine', term: 'dog', className: 'dog-color' },
  ]}
/>
```

- `term` is either a number (`searchWords[term]`) or a string
  (`searchWords[i] === term`).
- For the string form with duplicate `searchWords` entries, set
  `termMatch: 'first'` to bind to only the first matching entry, or omit
  it (default `'all'`) to aggregate every match across duplicates.
- `RegExp` entries are never matched by the string form — use the numeric
  form for those.

### `{ term, nth }` — a specific occurrence of a term

```tsx
<Highlight
  text="A cat sat. The cat watched."
  searchWords={['cat']}
  states={[
    { name: 'first-cat', term: 'cat', nth: 0, className: 'highlight-first' },
  ]}
/>
```

`nth` is **0-indexed** and counts occurrences of the term **in document
order** (by character position).

### Dev warnings

In development, these selectors warn (once per `states` array per render)
when:

- a numeric `term` is out of range of `searchWords`
- a string `term` is not present in `searchWords`
- `nth` exceeds the number of matches that term has

Set `silent: true` on the selector to suppress the warning for that
state. Production builds never emit these warnings.
````

- [ ] **Step 3: Add the multi-state guide example**

Open `docs/site/docs/guides/multi-state-styling.md`. Find a natural insertion point near the existing per-index examples. Add:

````markdown
### Stable references when search terms change

If your app's `searchWords` is dynamic (e.g., an autocomplete that adds
new queries as the user types), state selectors tied to global match
index will silently retarget every time a new query is added. Use
per-term selectors instead:

```tsx
function SearchResults({ queries, text }: { queries: string[]; text: string }) {
  return (
    <Highlight
      text={text}
      searchWords={queries}
      states={queries.map((q, i) => ({
        name: q,
        term: i,
        className: `query-${i}`,
      }))}
    />
  );
}
```

Each query keeps its color as the user adds or removes queries.
````

- [ ] **Step 4: Build docs locally to confirm**

Run: `pnpm --filter docs-site build`
Expected: Build succeeds. (If a different package name, use `pnpm --filter <name> build` — find with `cat docs/site/package.json | grep '"name"'`.)

- [ ] **Step 5: Commit**

```bash
git add docs/site/docs/api/highlight-state-selectors.md docs/site/docs/guides/multi-state-styling.md
git commit -m "docs: document per-search-term selectors"
```

---

### Task 13: README + ROADMAP

**Files:**
- Modify: `README.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Update the README selector table**

Open `README.md`. Find the section listing the `HighlightState` shapes
(it's a table or bullet list under the multi-state-styling section). Add
two new rows for `{ term }` and `{ term, nth }`. Mirror the format of the
existing rows. Brief one-liner each — point to the docs page for detail.

Example shape (adapt to match the existing format exactly — don't
introduce a different style):

```
| `{ term }`        | All matches of a search term (by string or index). |
| `{ term, nth }`   | The Nth occurrence (0-indexed) of a search term.   |
```

Also add a single short code-block example near the existing per-index
example. Don't duplicate the docs page — the README is a teaser.

- [ ] **Step 2: Move the ROADMAP entry**

Open `docs/ROADMAP.md`. In the `v1.0 candidates` list (under
`### v1.0 candidates`), find the line:

```markdown
- [ ] **Per-search-term match indexing** — `{ name, term: 'cat' | 0, index: 2 }` selector form. Stable references when `searchWords` changes dynamically (think autocomplete UIs).
```

Replace with:

```markdown
- [x] **Per-search-term match indexing** — shipped. Selector forms `{ name, term }` and `{ name, term, nth }` on `HighlightState`. See `docs/site/docs/api/highlight-state-selectors.md`.
```

Then under the `## Where we are` section's `### Shipped` list, append (matching the existing markdown style of that section):

```markdown
- Per-search-term match selectors — `{ term }` and `{ term, nth }` on `HighlightState`, with `termMatch: 'all' | 'first'` and `silent` modifiers.
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/ROADMAP.md
git commit -m "docs: announce per-search-term indexing in README and ROADMAP"
```

---

### Task 14: Full verify + release commit

**Files:** none (verification only)

- [ ] **Step 1: Run the full verify suite**

Run: `pnpm verify`
Expected: PASS — typecheck, all Vitest suites, build, publint + attw, size-limit.

The size budget is 3 KB brotlied. If it overshoots, something is wrong — escalate before continuing.

- [ ] **Step 2: Run visual regression one more time**

Run: `pnpm test:visual`
Expected: PASS.

- [ ] **Step 3: Confirm the feature commit landed correctly**

Run: `git log --oneline -20`

You should see a sequence ending roughly:
```
docs: announce per-search-term indexing in README and ROADMAP
docs: document per-search-term selectors
chore(visual): add per-term demo snapshots
chore(playground): add per-search-term demo
test(fuzz): assert term selector respects termIndex invariant
test(src): end-to-end Highlight render for term and nth selectors
feat(src): serialize term selector fields in useHighlight memo key
test(src): cover term selector composition with index and range
feat(src): support nth selector for per-term occurrence
test(src): cover string-term selector and termMatch first/all
feat(src): support numeric term selector with out-of-range warning
refactor(src): thread searchWords into applyStates
feat(src): add term and nth selector shapes to HighlightState union
docs(superpowers): add per-search-term indexing design
```

At least one of those `feat:` commits has `(src)` scope, which triggers a
minor bump in semantic-release. That's the intended release shape.

- [ ] **Step 4: Push when ready**

Push only after the user reviews the branch state. Do not push without
confirmation.

```bash
git status
git log --oneline origin/main..HEAD
```

Stop here. Hand back to the user for review and push approval.

---

## Self-review (post-write)

**Spec coverage check** (every section/requirement in
`docs/superpowers/specs/2026-05-22-per-search-term-indexing-design.md`):

- Public API (two new union members) → Task 1 ✓
- `term: number` semantics + out-of-range warning → Task 3 ✓
- `term: string` semantics + `termMatch` `'all' | 'first'` → Task 4 ✓
- `RegExp` entries never match string form → Task 4 ✓
- `nth` semantics + out-of-range warning → Task 5 ✓
- `nth: -1` out of range → Task 5 ✓
- `silent: true` suppression on every warning path → Tasks 3, 4, 5 ✓
- Composition with `index` / `range` / `indices` → Task 6 ✓
- `useMemo` dependency key serializes new fields → Task 7 ✓
- End-to-end `<Highlight>` render → Task 8 ✓
- Fuzz property: `term: i` → `termIndex === i` → Task 9 ✓
- Playground demo → Task 10 ✓
- Visual regression spec + baselines → Task 11 ✓
- Docs site API page + multi-state guide → Task 12 ✓
- README + ROADMAP → Task 13 ✓
- `pnpm verify` final gate → Task 14 ✓

**Placeholder scan:** None. Every step shows concrete code or an exact command.

**Type consistency:** `HighlightStateTerm`, `HighlightStateTermNth`,
`resolveTermIndices`, `maybeWarnUnknownTerm`, `maybeWarnNthOutOfRange`
used consistently across Tasks 1-7. Public API field names (`term`,
`nth`, `termMatch`, `silent`) are stable.

**No spec gap.** Plan covers every numbered section of the spec.
