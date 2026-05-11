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
| `searchWords` | `Array<string \| RegExp>` | Terms to find. String terms are auto-escaped by default. RegExps are cloned with `g` flag forced on. |

## Matching options

| Prop | Type | Default | Description |
|---|---|---|---|
| `caseSensitive` | `boolean` | `false` | Match case (string terms only; regex flags are honored as-is). |
| `autoEscape` | `boolean` | `true` | Escape regex special chars in string terms. |
| `sanitize` | `(s: string) => string` | — | Pre-process text and search source before matching. Use for diacritic-insensitive search. |
| `findChunks` | `(input: FindChunksInput) => RawChunk[]` | — | Custom matcher; completely replaces the default `matchAll`-based implementation. |
| `overlapStrategy` | `'merge' \| 'nest' \| 'first-wins'` | `'merge'` | How overlapping matches are resolved. |

## State options

| Prop | Type | Default | Description |
|---|---|---|---|
| `states` | `HighlightState[]` | — | Per-match layered styling. Each entry selects a subset of matches and applies a className and/or style on top of the base. |

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
