---
sidebar_position: 3
---

# Quick start

## Install

```bash
pnpm add one-more-highlight
```

## Highlight all matches

```tsx
import { Highlight } from 'one-more-highlight';

<Highlight
  text="hello world hello"
  searchWords={['hello']}
  highlightClassName="my-highlight"
/>
// → <mark class="my-highlight">hello</mark> world <mark class="my-highlight">hello</mark>
```

## Add multi-state styling

```tsx
import { Highlight, match } from 'one-more-highlight';

<Highlight
  text="hello world hello"
  searchWords={['hello']}
  highlightClassName="hl-base"
  states={[
    { name: 'active', ...match.one(0), className: 'hl-active' },
  ]}
/>
// Match 0 gets both "hl-base" and "hl-active".
// Match 1 gets only "hl-base".
```

Continue to the [Guides](/docs/guides/basic-highlighting) for live demos and detailed walkthroughs.
