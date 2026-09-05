---
sidebar_position: 1
---

# `<Highlight>` props

```tsx
import { Highlight } from 'one-more-highlight';
```

## Required props

| Prop | Type | Description |
|---|---|---|
| `text` | `string` | The text to search and render. |

Plus **exactly one** source — `searchWords` or `ranges`.

## Source props

`searchWords` and `ranges` are mutually exclusive: the props type is a
discriminated union, so passing both (or neither) is a type error.

| Prop | Type | Description |
|---|---|---|
| `searchWords` | `Array<string \| RegExp>` | Terms to find. String terms are auto-escaped by default. RegExps are cloned with `g` flag forced on. |
| `ranges` | `HighlightRange[]` | Precomputed match offsets. Skips the built-in matcher entirely. |

### Controlled ranges

Supply offsets you already have — from Algolia, Elasticsearch, Meilisearch, a
server-side matcher, an NLP tokenizer, a diff engine, or AI citations — and
`<Highlight>` becomes a pure text-range renderer.

```tsx
<Highlight
  text={text}
  ranges={[
    { id: 'result-1', start: 120, end: 134, termId: 'react', metadata: { source: 'search' } },
  ]}
/>
```

| Field | Type | Description |
|---|---|---|
| `start` / `end` | `number` | Required. Code-unit offsets into `text`, clamped to its bounds. Empty or inverted ranges are dropped. |
| `id` | `string` | Optional, opaque. Carried through untouched. |
| `termId` | `string` | Optional. Distinct `termId`s are numbered in first-appearance order to form `termIndex`, so `{ term }` / `{ term, nth }` selectors work under `ranges` too. |
| `metadata` | `Record<string, unknown>` | Optional, opaque. Readable from predicate selectors and `renderMatch`. |

The originating range is exposed on the segment as `MatchSegment.range`, so
`renderMatch` can read `id` and `metadata` back out. Overlapping ranges go
through the same `overlapStrategy` as ordinary matches.

## Matching options

These configure the built-in matcher and apply only alongside `searchWords` —
under `ranges` the type marks them as `undefined`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `caseSensitive` | `boolean` | `false` | Match case (string terms only; regex flags are honored as-is). |
| `autoEscape` | `boolean` | `true` | Escape regex special chars in string terms. |
| `sanitize` | `(s: string) => string` | — | Pre-process text and search source before matching. Use for diacritic-insensitive search. |
| `findChunks` | `(input: FindChunksInput) => RawChunk[]` | — | Custom matcher; completely replaces the default `matchAll`-based implementation. |

`overlapStrategy` applies to both sources:

| Prop | Type | Default | Description |
|---|---|---|---|
| `overlapStrategy` | `'merge' \| 'nest' \| 'first-wins'` | `'merge'` | How overlapping matches are resolved. |

## State options

| Prop | Type | Default | Description |
|---|---|---|---|
| `states` | `HighlightState[]` | — | Per-match layered styling. Each entry selects a subset of matches and applies a className and/or style on top of the base. A predicate selector's context is typed for the source in use. |

## Rendering options

| Prop | Type | Default | Description |
|---|---|---|---|
| `highlightTag` | `keyof JSX.IntrinsicElements \| ComponentType` | `'mark'` | Element or component for matches. Custom components receive `matchIndex` and `states` as extra props. |
| `highlightClassName` | `string` | — | Base className applied to every match. |
| `highlightStyle` | `CSSProperties` | — | Base inline style applied to every match. |
| `unhighlightTag` | `keyof JSX.IntrinsicElements` | — | Element to wrap non-match segments (default: no wrapper). |
| `unhighlightClassName` | `string` | — | className for non-match wrappers (only applied when `unhighlightTag` is set). |
| `unhighlightStyle` | `CSSProperties` | — | Inline style for non-match wrappers. |
| `renderMatch` | `(seg: MatchSegment, defaults: MatchDefaults) => ReactNode` | — | Full render-prop control over match output. |

## Root element options

| Prop | Type | Default | Description |
|---|---|---|---|
| `as` | `keyof JSX.IntrinsicElements` | `'span'` | Root wrapper element. |
| `className` | `string` | — | className on the root wrapper. |
| `style` | `CSSProperties` | — | Inline style on the root wrapper. |

Additional HTML attributes are forwarded to the root element.

`<Highlight>` is wrapped with `forwardRef` — you can pass a `ref` and it will be attached to the root element (the `as` element, default `<span>`).

## Regex defenses

When you pass a `RegExp` instance in `searchWords`, `<Highlight>` does three things to avoid common footguns:

- **Clones the regex** so the consumer-supplied object's `lastIndex` is never mutated (regex objects carry stateful `lastIndex` when used with `g` or `y` flags).
- **Forces the `g` flag on** in the clone so `matchAll` walks the full string.
- **Drops the sticky `y` flag** from the clone, because anchored sticky matching is incompatible with this component's "find all occurrences" semantics. A one-time `console.warn` fires in development (`NODE_ENV !== 'production'`) when a sticky regex is passed.

The original regex you passed in is never modified.
