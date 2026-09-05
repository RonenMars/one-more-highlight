---
sidebar_position: 2
---

# `useHighlight`

```tsx
import { useHighlight } from 'one-more-highlight';
```

Returns `{ segments, getMatchCount, matchRef, getMatchNode, getMatchByIndex, getMatchAt, scrollToMatch }`. `segments` covers the full input text as alternating `MatchSegment` / `TextSegment` with no gaps. `getMatchCount()` returns the number of matching segments — useful for validating `states` config or rendering "N results" UI. The remaining members support match navigation: a node registry (`matchRef`/`getMatchNode`), lookups by index or character position (`getMatchByIndex`/`getMatchAt`), and scrolling a match into view (`scrollToMatch`).

## Signature

```ts
function useHighlight(options: UseHighlightOptions): UseHighlightResult

interface UseHighlightResult {
  segments: ReadonlyArray<Segment>;
  getMatchCount: () => number;
  /** Ref callback for a rendered match node, keyed by `matchIndex`. Attach to each match's `ref`. */
  matchRef: (matchIndex: number) => (node: ScrollableMatchNode | null) => void;
  /** Look up a match's registered DOM node by index, or `null` if it isn't mounted (or `matchRef` was never attached). */
  getMatchNode: (matchIndex: number) => ScrollableMatchNode | null;
  /** Look up a match segment by its `matchIndex`. */
  getMatchByIndex: (matchIndex: number) => MatchSegment | undefined;
  /** Look up the match segment covering a character offset in `text`, if any. */
  getMatchAt: (charPos: number) => MatchSegment | undefined;
  /** Scroll a match into view. Returns `false` if the match isn't registered (not yet mounted, or `matchRef` never attached). */
  scrollToMatch: (matchIndex: number, options?: MatchScrollOptions) => boolean;
}
```

## Options

`UseHighlightOptions` accepts all matching and state options from `<Highlight>` — the rendering options (`highlightTag`, `highlightClassName`, `renderMatch`, etc.) are excluded.

| Option | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Text to search. |
| `searchWords` | `Array<string \| RegExp>` | one source required | Terms to find. Mutually exclusive with `ranges`. |
| `ranges` | `HighlightRange[]` | one source required | Precomputed offsets; skips the matcher. Mutually exclusive with `searchWords`. |
| `caseSensitive` | `boolean` | `false` | Case-sensitive matching. `searchWords` only. |
| `autoEscape` | `boolean` | `true` | Escape regex special chars in string terms. `searchWords` only. |
| `sanitize` | `(s: string) => string` | — | Pre-process text before matching. `searchWords` only. |
| `findChunks` | `(input: FindChunksInput) => RawChunk[]` | — | Custom matcher. `searchWords` only. |
| `overlapStrategy` | `'merge' \| 'nest' \| 'first-wins'` | `'merge'` | Overlap resolution strategy. |
| `states` | `HighlightState[]` | — | Per-match state selectors. |

## Return type

```ts
type Segment = MatchSegment | TextSegment;

interface MatchSegment {
  text: string;
  isMatch: true;
  matchIndex: number;             // 0-based global document order
  start: number;                  // character offset in `text`
  end: number;
  states: ReadonlyArray<string>;  // names of states selecting this match
  range?: HighlightRange;         // the originating `ranges` entry, if any
}

interface TextSegment {
  text: string;
  isMatch: false;
  start: number;
  end: number;
}
```

## Match navigation

`matchRef(matchIndex)` returns a stable ref callback per index — attach it
to each rendered match (e.g. via `renderMatch`) to register the node:

```tsx
const { segments, matchRef, scrollToMatch } = useHighlight({ text, searchWords });

// in render, per match segment:
<mark ref={matchRef(seg.matchIndex)}>{seg.text}</mark>

// elsewhere:
scrollToMatch(2, { behavior: 'smooth', block: 'center' });
```

Nodes are only registered once mounted with a `matchRef`-attached ref — an
unmounted or never-registered match makes `getMatchNode`/`scrollToMatch`
return `null`/`false`. This registry is what
[`useRovingMatchFocus`](./use-roving-match-focus) (from
`one-more-highlight/navigation`) uses to move DOM focus between matches.

## Memoization

`useHighlight` uses `useMemo` internally. Re-computation is triggered only when `searchWords` or `ranges` contents change (deep comparison — `ranges` including `metadata`) or when any other option changes by reference. A predicate selector's `match` is compared by identity, so an inline one re-computes every render. Pass stable references (or `useMemo`/`useCallback`) for `states` and `findChunks` to avoid unnecessary recalculation.
