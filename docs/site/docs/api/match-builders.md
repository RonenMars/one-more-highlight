---
sidebar_position: 3
---

# `match` builders

```tsx
import { match } from 'one-more-highlight';
```

Builder functions for creating `HighlightState` selector objects. Spread their return value into a state entry:

```tsx
const states = [
  { name: 'active', ...match.one(2), className: 'hl-active' },
];
```

## `match.one(index)`

Selects a single match by zero-based document-order index.

```ts
match.one(2)
// → { index: 2 }
```

## `match.range(from, to)`

Selects all matches from index `from` to `to`, inclusive on both ends.

```ts
match.range(0, 3)
// → { range: [0, 3] }
```

## `match.many(indices)`

Selects a specific list of match indices.

```ts
match.many([0, 2, 5])
// → { indices: [0, 2, 5] }
```

## Index semantics

Match indices are **global document order** — match #0 is the first occurrence in the text regardless of which `searchWords` entry matched it. Indices are 0-based.

Out-of-range indices are silently ignored in production. In development (`NODE_ENV !== 'production'`), a one-time `console.warn` fires per component when an index exceeds the total match count.
