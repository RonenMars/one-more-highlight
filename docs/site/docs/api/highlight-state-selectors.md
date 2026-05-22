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

## Per-search-term selectors

When `searchWords` changes dynamically (autocomplete, filter chips, query
refinement), global match indices shift. Per-search-term selectors
address matches by which search word produced them, so references stay
stable across `searchWords` mutations.

### `{ term }` — all matches of a term

```tsx
<Highlight
  text="A cat sat on the mat."
  searchWords={['cat', 'dog']}
  states={[
    { name: 'feline', term: 'cat', className: 'cat-color' },
    { name: 'canine', term: 'dog', className: 'dog-color' },
  ]}
/>
```

- `term` is either a number (`searchWords[term]`) or a string
  (`searchWords[i] === term`).
- For the string form with duplicate `searchWords` entries, set
  `termMatch: 'first'` to bind to only the first matching entry, or omit
  it (default `'all'`) to aggregate every match across duplicates.
- `RegExp` entries are never matched by the string form — use the numeric
  form for those.

### `{ term, nth }` — a specific occurrence of a term

```tsx
<Highlight
  text="A cat sat. The cat watched."
  searchWords={['cat']}
  states={[
    { name: 'first-cat', term: 'cat', nth: 0, className: 'highlight-first' },
  ]}
/>
```

`nth` is **0-indexed** and counts occurrences of the term **in document
order** (by character position).

### Dev warnings

In development, these selectors warn (once per `states` array per render)
when:

- a numeric `term` is out of range of `searchWords`
- a string `term` is not present in `searchWords`
- `nth` exceeds the number of matches that term has

Set `silent: true` on the selector to suppress the warning for that
state. Production builds never emit these warnings.
