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

type HighlightState<Ctx = MatchContext> =
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
    })
  | (HighlightStateBase & { match: (context: Ctx) => boolean });
```

`HighlightState` takes an optional context type parameter used only by the
predicate member — `HighlightState<Ctx = MatchContext>`. You rarely write it:
the [source union](#highlightsource) supplies the right context for the source
in use.

Each member is also exported individually (`HighlightStateOne`, `HighlightStateRange`, `HighlightStateMany`, `HighlightStateTerm`, `HighlightStateTermNth`, `HighlightStatePredicate`) for consumers building typed helpers or narrowing predicates. See [`HighlightState` selectors](/docs/api/highlight-state-selectors) for the semantics of each form.

:::note Selector resolution
The union does not enforce mutual exclusivity at the type level — TypeScript will accept an object that carries more than one selector field (e.g., both `index` and `range`). In that case the library picks the first present field, in declaration order: `index` → `range` → `indices` → `match` → `term` (with `nth` further refining `term`). Stick to one selector field per entry.
:::

## `HighlightRange`

One precomputed match for the `ranges` source. `start` / `end` are code-unit offsets into `text`; the rest is optional and opaque to the library.

```ts
interface HighlightRange {
  start: number;
  end: number;
  id?: string;
  termId?: string;
  metadata?: Readonly<Record<string, unknown>>;
}
```

## `HighlightSource`

The mutually exclusive input shapes shared by `<Highlight>`, `<CssHighlight>`, `<HighlightText>` and `useHighlight`. `states` sits inside each branch so a predicate selector's context is typed for the source in use, and the matcher options are only available alongside `searchWords`.

```ts
type HighlightSource =
  | (MatcherOptions & {
      searchWords: ReadonlyArray<string | RegExp>;
      states?: ReadonlyArray<HighlightState<SearchMatchContext>>;
      ranges?: undefined;
    })
  | ({ [K in keyof MatcherOptions]?: undefined } & {
      ranges: ReadonlyArray<HighlightRange>;
      states?: ReadonlyArray<HighlightState<RangeMatchContext>>;
      searchWords?: undefined;
    });
```

:::note Why `?: undefined` and not `?: never`
The package compiles under `exactOptionalPropertyTypes`, where a `never` branch rejects an explicit `ranges={undefined}` — which is how callers toggle between sources. `?: undefined` narrows identically and still makes "both" and "neither" type errors.
:::

## `MatchContext`

What a [predicate selector](/docs/api/highlight-state-selectors#predicate) receives, as a union of the two source flavors.

```ts
interface MatchContextBase {
  index: number;
  text: string;
  start: number;
  end: number;
  source: string;
  nthOfTerm: number;
}

interface SearchMatchContext extends MatchContextBase {
  term: string | RegExp;
  termIndex: number;
  range?: undefined;
}

interface RangeMatchContext extends MatchContextBase {
  range: HighlightRange;
  term: string | undefined;
  termIndex: number;
}

type MatchContext = SearchMatchContext | RangeMatchContext;
```

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

Options type for `useHighlight`. A subset of `HighlightProps` without rendering props — `{ text, overlapStrategy? } & HighlightSource`.

## `UseHighlightResult`

Return type of `useHighlight`.

```ts
interface UseHighlightResult {
  segments: ReadonlyArray<Segment>;
  getMatchCount: () => number;
  matchRef: (matchIndex: number) => (node: ScrollableMatchNode | null) => void;
  getMatchNode: (matchIndex: number) => ScrollableMatchNode | null;
  getMatchByIndex: (matchIndex: number) => MatchSegment | undefined;
  getMatchAt: (charPos: number) => MatchSegment | undefined;
  scrollToMatch: (matchIndex: number, options?: MatchScrollOptions) => boolean;
}
```

`getMatchCount()` returns the number of `MatchSegment` entries — useful for validating `states` indices or rendering "N results found" UI. See [match navigation](/docs/api/use-highlight#match-navigation) for the remaining members.

## `ScrollableMatchNode`, `MatchScrollOptions`

The structural shape `matchRef`/`getMatchNode`/`scrollToMatch` need from a mounted match node — a real DOM `Element` satisfies it structurally, so no cast is needed when attaching `matchRef` to a JSX ref.

```ts
interface ScrollableMatchNode {
  scrollIntoView: (options?: MatchScrollOptions) => void;
  focus?: () => void;
}

interface MatchScrollOptions {
  behavior?: 'auto' | 'smooth' | 'instant';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}
```

## React Native match-layout types

Exported from `one-more-highlight/native` (not the web entry). They describe the [scroll-to-match](/docs/engines/react-native#scroll-to-a-match) API.

### `MatchLayout`

Layout of one match, reported by `onMatchesLayout` and `getMatchLayout`. `y` / `height` are the box of the **first line** the match falls on, relative to the root `<Text>`.

```ts
interface MatchLayout {
  matchIndex: number;
  termIndex: number;
  start: number;
  end: number;
  lineIndex: number;
  y: number;
  height: number;
}
```

### `MeasuredMatch`

Coordinates resolved by `measureMatch` into an ancestor's or the window's space. `x` / `width` are the root `<Text>`'s box (RN can't measure a substring horizontally); `y` / `height` pinpoint the match's line within it.

```ts
interface MeasuredMatch {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### `HighlightLayoutHandle`

The imperative handle exposed via the `layoutRef` prop, kept separate from `ref` (which stays a raw `Text`).

```ts
interface HighlightLayoutHandle {
  getMatchLayout: (matchIndex: number) => MatchLayout | null;
  measureMatch: (
    matchIndex: number,
    relativeTo?: RefObject<unknown> | number,
  ) => Promise<MeasuredMatch | null>;
}
```
