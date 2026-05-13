---
sidebar_position: 4
---

# TypeScript types

All types are exported from `one-more-highlight`.

## `HighlightState`

A discriminated union for state selector entries:

```ts
type HighlightState =
  | { name: string; index: number; className?: string; style?: CSSProperties }
  | { name: string; range: [number, number]; className?: string; style?: CSSProperties }
  | { name: string; indices: number[]; className?: string; style?: CSSProperties };
```

Use the `match` builders to construct these without touching the union directly.

## `OverlapStrategy`

```ts
type OverlapStrategy = 'merge' | 'nest' | 'first-wins';
```

- `merge` (default) — overlapping matches are merged into a single segment
- `nest` — overlapping matches are kept as individually addressable segments
- `first-wins` — later overlapping matches are dropped

## `Segment`, `MatchSegment`, `TextSegment`

See [`useHighlight` return type](/docs/api/use-highlight#return-type).

## `HighlightProps`

Full props type for the `<Highlight>` component. Re-exported for consumers who want to build typed wrappers:

```tsx
import type { HighlightProps } from 'one-more-highlight';

function MyHighlight(props: HighlightProps) {
  return <Highlight {...props} highlightClassName="my-mark" />;
}
```

## `UseHighlightOptions`

Options type for `useHighlight`. A subset of `HighlightProps` without rendering props.

## `UseHighlightResult`

Return type of `useHighlight`.

```ts
interface UseHighlightResult {
  segments: ReadonlyArray<Segment>;
  getMatchCount: () => number;
}
```

`getMatchCount()` returns the number of `MatchSegment` entries — useful for validating `states` indices or rendering "N results found" UI.
