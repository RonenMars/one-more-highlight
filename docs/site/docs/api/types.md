---
sidebar_position: 4
---

# TypeScript types

All types are exported from `one-more-highlight`.

## `HighlightState`

A discriminated union for state selector entries. Each member shares a `name` plus optional `className` / `style`, and is identified by which selector field it carries:

```ts
type HighlightStateBase = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

type HighlightState =
  | (HighlightStateBase & { index: number })
  | (HighlightStateBase & { range: readonly [number, number] })
  | (HighlightStateBase & { indices: ReadonlyArray<number> })
  | (HighlightStateBase & {
      term: string | number;
      termMatch?: 'all' | 'first';
      silent?: boolean;
    })
  | (HighlightStateBase & {
      term: string | number;
      nth: number;
      termMatch?: 'all' | 'first';
      silent?: boolean;
    });
```

Each member is also exported individually (`HighlightStateOne`, `HighlightStateRange`, `HighlightStateMany`, `HighlightStateTerm`, `HighlightStateTermNth`) for consumers building typed helpers or narrowing predicates. See [`HighlightState` selectors](/docs/api/highlight-state-selectors) for the semantics of each form.

:::note Selector resolution
The union does not enforce mutual exclusivity at the type level — TypeScript will accept an object that carries more than one selector field (e.g., both `index` and `range`). In that case the library picks the first present field, in declaration order: `index` → `range` → `indices` → `term` (with `nth` further refining `term`). Stick to one selector field per entry.
:::

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
