---
sidebar_position: 3
---

# `HighlightState` selectors

A `HighlightState` is a plain object: a `name`, an optional `className` and/or `style`, and **exactly one** selector field that says which matches it applies to. The selector field is the discriminator — TypeScript narrows on `'index' in state` etc.

```tsx
const states = [
  { name: 'active', index: 2, className: 'hl-active' },
];
```

## `index: number`

Selects a single match by zero-based document-order index.

```ts
{ name: 'active', index: 2 }
```

## `range: [number, number]`

Selects all matches from index `from` to `to`, inclusive on both ends.

```ts
{ name: 'context', range: [0, 3] }
```

## `indices: ReadonlyArray<number>`

Selects a specific list of match indices.

```ts
{ name: 'bookmarked', indices: [0, 2, 5] }
```

## Index semantics

Match indices are **global document order** — match #0 is the first occurrence in the text regardless of which `searchWords` entry matched it. Indices are 0-based.

Out-of-range indices are silently ignored in production. In development (`NODE_ENV !== 'production'`), a one-time `console.warn` fires per component when an index exceeds the total match count.
