# Per-search-term match indexing — design

**Status:** approved
**Date:** 2026-05-22
**Roadmap item:** `docs/ROADMAP.md` → v1.0 candidate → *Per-search-term match indexing*

## Problem

Today, `HighlightState` selectors address matches by their **global** match
index — the order they appear in the final, post-overlap-resolution
segment list. That is fragile for any UI where `searchWords` changes
dynamically (autocomplete, filter chips, query refinement). Adding a new
search term re-numbers every later match, so a state like
`{ name: 'active', index: 2 }` silently retargets to a different
substring.

Consumers need a way to say "the 2nd match of `'cat'`" or "every match of
`searchWords[0]`" — references that survive `searchWords` mutations.

## Goals

- New selector forms in `HighlightState` that address matches **per
  search term** rather than globally.
- Support both numeric (`term: 0` → `searchWords[0]`) and string
  (`term: 'cat'` → entries equal to `'cat'`) references.
- Support `nth` for picking a specific occurrence within a term's matches.
- Stay consistent with the project's discriminated-union ergonomics
  (ADR-0001 — no builders).
- Zero impact on consumers not using the new forms.

## Non-goals

- A `matchId` form keyed to data identity (deferred — separate v1.0
  candidate in `ROADMAP.md`).
- Public `getMatchByIndex(i)` / `getMatchAt(charPos)` helpers (separate
  v1.0 candidate).
- A grapheme-aware matching mode (v2.x roadmap).
- Helpers on the hook return value to enumerate matches by term. If
  needed later, layer it on; not part of this change.

## Public API

Two new members in the `HighlightState` discriminated union, both in
`src/types.ts`:

```ts
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

### Discriminator

The new selectors are detected by the presence of the `term` field.
`HighlightStateTermNth` is further discriminated by the presence of `nth`.
Existing selectors (`index`, `range`, `indices`) never carry `term`, so
narrowing works without renaming or restructuring existing forms.

### Field semantics

| Field | Type | Default | Behavior |
| --- | --- | --- | --- |
| `term` | `string \| number` | — | Identifies which entries in `searchWords` this selector targets. |
| `nth` | `number` | — | 0-indexed occurrence among this term's matches, in document order. Omitted → selects all matches of the term. |
| `termMatch` | `'all' \| 'first'` | `'all'` | Only relevant when `term` is a string and `searchWords` contains duplicates. `'all'` aggregates every entry equal to `term`; `'first'` binds to `searchWords.indexOf(term)`. |
| `silent` | `boolean` | `false` | Suppress dev-mode warnings for this selector. Default behavior is to warn (consistent with existing out-of-range warning). |

### Term resolution

- **`term: number`** — references `searchWords[term]` directly. If the
  index is out of range (negative or `>= searchWords.length`), the
  selector matches nothing and emits a one-time dev warning unless
  `silent: true`.
- **`term: string`** — collects every index `i` such that
  `searchWords[i] === term`. **`RegExp` entries never match the string
  form**, even if their `.source` happens to equal the string. If no
  entries match, the selector matches nothing and emits a one-time dev
  warning unless `silent: true`.
- With `termMatch: 'first'` and `term: string`, only the first matching
  entry is used. With `termMatch: 'all'` (default), all matching entries
  are aggregated.

### `nth` semantics

- Counts occurrences **in document order** (sorted by `start`, ties
  broken by `end`), among combined chunks whose `termIndex` is in the
  resolved term-index set.
- `nth: 0` → first occurrence; `nth: 1` → second; etc.
- If `nth >= count(resolvedMatches)`, the selector matches nothing and
  emits a one-time dev warning unless `silent: true`.
- `nth: -1` (and other negatives) is treated as out of range — same
  silent-or-warn path. We do not adopt Python-style negative indexing
  here; that's a separate ergonomics conversation.

### Edge cases pinned

- `term: 'cat'` with `searchWords: ['cat', /Cat/i]` and
  `termMatch: 'all'` → matches from `'cat'` only. The `RegExp` is not
  considered.
- `term: 0` and `searchWords[0]` is a `RegExp` → matches from that
  regex's matches. The numeric form is the escape hatch for `RegExp`
  references.
- `term: 'cat'` with `searchWords: ['cat', 'cat']` and `termMatch: 'all'`
  → matches from both entries are aggregated, then sorted in document
  order. (The dedupe behavior of `combineChunks(strategy)` runs first,
  so overlapping matches from the duplicate entries collapse per the
  consumer's chosen strategy. `termIndex` on the surviving chunk is
  whichever entry's match won the strategy.)
- Empty `searchWords` + `term: 'cat'` → no matches, warning fires (it's a
  config bug, but `silent` allows suppression in tests).
- `nth` on a term with zero matches → warning fires unless `silent`.
- The same `name` appearing on multiple states (existing behavior) is
  preserved: each selector tags independently, and the resulting
  `states: ReadonlyArray<string>` on a `MatchSegment` may contain the
  same name twice. The render layer is responsible for deduping if it
  cares; today it doesn't.

## Implementation

### Files touched

| File | Change |
| --- | --- |
| `src/types.ts` | Add `HighlightStateTerm` and `HighlightStateTermNth` to the union. |
| `src/applyStates.ts` | Extend `selects()` and `highestSelected()`; extend `maybeWarnOutOfRange()` for the new failure modes; thread `searchWords` through. `applyStates` is internal — no public API impact. |
| `src/useHighlight.ts` | Pass `searchWords` to `applyStates`. Verify `useMemo` dependency key serializes the new fields. |
| `tests/applyStates.test.ts` | New cases for `term` (number / string), `termMatch` (`'all'` / `'first'`), `nth`, warnings, `silent`, composition with existing forms. |
| `tests/Highlight.test.tsx` | One end-to-end render test verifying class names land on the right matches. |
| `tests/useHighlight.test.tsx` | Verify memoization key invalidates when `term` / `nth` / `termMatch` / `silent` change. |
| `examples/playground/...` | A new demo route showing per-term states (e.g., two terms in two state colors + an `nth: 0` "first match" badge). |
| `tests/visual/specs/...` | Spec for the new demo route. Regenerate baselines for the 5-project matrix. |
| `docs/site/docs/api/highlight-state-selectors.md` | New section for `term` / `nth` selectors with worked examples. |
| `docs/site/docs/guides/...` (multi-state styling guide) | Add an example block for the autocomplete use case. |
| `README.md` | Update the `HighlightState` shapes table + a one-liner example. |
| `docs/ROADMAP.md` | Move "Per-search-term match indexing" from v1.0 candidates → Shipped. |
| `CHANGELOG.md` | Auto-managed by semantic-release on commit. The `feat:` commit footer must describe the new selector forms. |

### `applyStates` algorithm

```text
applyStates(chunks, states, searchWords):
  if states empty -> tag every chunk with []

  // Pre-compute, for each state, the set of matchIndices it selects.
  // Most existing selectors (index/range/indices) compute O(1) on lookup,
  // so they stay inline. Only the term-based selectors need a pre-pass
  // because of nth's document-order requirement.

  for each state s:
    if s has 'term':
      termIndices = resolveTerm(s, searchWords)
      candidates  = chunks.filter(c => termIndices.has(c.termIndex))
                          .sort by start, then end
      if s has 'nth':
        if candidates[nth] exists -> selected = { candidates[nth].matchIndex }
        else -> selected = {}; warn unless s.silent
      else:
        selected = set of candidates' matchIndices
      if termIndices empty -> warn unless s.silent
      record selected for this state

  for each chunk c, in declaration order of states:
    names = [ s.name for each s where c.matchIndex in selected(s) ]
    tag c with names
```

### `useMemo` dependency key

`useHighlight` currently serializes `states` via `JSON.stringify`-ish
joining. Verify it captures `term`, `nth`, `termMatch`, `silent`. If it
doesn't, extend the key builder. (Most likely it already does, since the
key is a structural traversal of the union, but this is an explicit check
in the implementation plan.)

### Dev warnings

Reuse the existing `WeakSet<states>` "warn once per states array" guard
in `applyStates.ts`. Add new warning messages:

- `[one-more-highlight] state "X" references term index N which is out of range of searchWords (length M).`
- `[one-more-highlight] state "X" references term "Y" which is not present in searchWords.`
- `[one-more-highlight] state "X" has nth: N but term "Y" only has M matches.`

Each respects the per-state `silent: true`. Production builds never emit
these (existing `process.env.NODE_ENV` guard).

## Testing strategy

| Layer | Tests |
| --- | --- |
| Unit (`tests/applyStates.test.ts`) | Term-by-number, term-by-string, `termMatch: 'first'` vs `'all'` with duplicate entries, `nth` selecting a specific occurrence, `nth` out-of-range warning, unknown-term warning, `silent: true` suppresses warnings, composition with `index` / `range` / `indices` on the same chunk. |
| Hook (`tests/useHighlight.test.tsx`) | Memoization invalidates on each new field; SSR-safe (no DOM access introduced). |
| Component (`tests/Highlight.test.tsx`) | End-to-end render — given `searchWords` + `states`, the right `<mark>` elements receive the right class names. |
| Property (`tests/fuzz.test.ts`) | No new invariants needed; existing `joined(segments) === input` invariant covers correctness of the segment list, and the new selectors don't change segment boundaries. *Add a small fuzz case asserting that for any random `searchWords` and a `term: i` selector, all tagged matches have `termIndex === i`.* |
| Visual (`tests/visual/specs/...`) | New spec covering the new demo route; baselines for the 5-project matrix. |

## Bundle impact

Adding two members to a discriminated union and ~30 lines to
`applyStates.ts`. No new dependencies. No new public exports beyond the
type members. Expected impact: well under 100 bytes brotlied.

`pnpm size` must stay under the 3 KB budget. If it doesn't, that's a
signal we're doing something wrong — escalate.

## Versioning and rollout

This is an additive change to `HighlightState`. No existing consumer code
breaks. It's a **minor** semantic-release bump — commit footer
`feat(src): add term and nth selector forms to HighlightState`.

`ROADMAP.md` updates from v1.0 candidate → Shipped in the same PR.

## Out of scope (explicitly)

- `matchId` selectors keyed to data identity.
- `getMatchByIndex` / `getMatchAt` public helpers.
- A builder helper for `term` selectors. ADR-0001 stands.
- Negative-index support for `nth`.
- Helpers to enumerate per-term match counts on the hook result.
- Renaming `termIndex` on `MatchSegment`. The name predates this feature
  and stays as-is.

## Open questions

None at design time. If implementation surfaces something, it goes to the
written implementation plan and back through review.

## References

- `docs/ROADMAP.md` — v1.0 candidates list.
- `docs/adr/0001-remove-match-builders.md` — discriminated-union
  philosophy.
- `src/applyStates.ts` — current selector dispatch.
- `src/types.ts` — current `HighlightState` union.
