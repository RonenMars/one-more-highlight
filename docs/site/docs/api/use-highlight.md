---
sidebar_position: 2
---

# `useHighlight`

```tsx
import { useHighlight } from 'one-more-highlight';
```

Returns `{ segments, getMatchCount }`. `segments` covers the full input text as alternating `MatchSegment` / `TextSegment` with no gaps. `getMatchCount()` returns the number of matching segments — useful for validating `states` config or rendering "N results" UI.

## Signature

```ts
function useHighlight(options: UseHighlightOptions): UseHighlightResult

interface UseHighlightResult {
  segments: ReadonlyArray<Segment>;
  getMatchCount: () => number;
}
```

## Options

`UseHighlightOptions` accepts all matching and state options from `<Highlight>` — the rendering options (`highlightTag`, `highlightClassName`, `renderMatch`, etc.) are excluded.

| Option | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Text to search. |
| `searchWords` | `Array<string \| RegExp>` | required | Terms to find. |
| `caseSensitive` | `boolean` | `false` | Case-sensitive matching. |
| `autoEscape` | `boolean` | `true` | Escape regex special chars in string terms. |
| `sanitize` | `(s: string) => string` | — | Pre-process text before matching. |
| `findChunks` | `(input: FindChunksInput) => RawChunk[]` | — | Custom matcher. |
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
}

interface TextSegment {
  text: string;
  isMatch: false;
  start: number;
  end: number;
}
```

## Memoization

`useHighlight` uses `useMemo` internally. Re-computation is triggered only when `searchWords` contents change (deep comparison) or when any other option changes by reference. Pass stable references (or `useMemo`/`useCallback`) for `states` and `findChunks` to avoid unnecessary recalculation.
