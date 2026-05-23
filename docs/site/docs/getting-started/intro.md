---
sidebar_position: 1
---

# Introduction

**one-more-highlight** is a TypeScript-first React library for highlighting substrings in text — with first-class support for **multi-state per-match styling**.

Every match gets a base style. Specific occurrences — by single index, index range, or arbitrary list — get additional layered styles on top. Classes concatenate, styles shallow-merge.

```tsx
import { Highlight } from 'one-more-highlight';

<Highlight
  text="time time time time time"
  searchWords={['time']}
  highlightClassName="hl-base"
  states={[
    { name: 'active',     index: 2,         className: 'hl-active' },
    { name: 'preview',    range: [0, 1],    className: 'hl-preview' },
    { name: 'bookmarked', indices: [3, 4],  className: 'hl-bookmark' },
  ]}
/>
```

## Key features

- **TypeScript-first** — full types, discriminated-union `HighlightState` (selectors: `index`, `range`, `indices`)
- **Multi-state styling** — base + layered styles selected by index, range, or list
- **Headless `useHighlight` hook** for DIY rendering
- **`renderMatch` render-prop** for full per-match output control
- **~2 KB brotlied** — ESM + CJS dual build, SSR-safe, zero CSS shipped

## When to use this library

Use `one-more-highlight` when:
- You need to highlight search results and mark the "current" or "active" match differently
- You need to combine multiple visual states on overlapping or adjacent matches
- You need full TypeScript types over the highlight state

For basic one-style highlighting without multi-state needs, simpler libraries may be sufficient.
