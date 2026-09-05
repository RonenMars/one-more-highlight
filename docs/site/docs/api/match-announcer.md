---
sidebar_position: 6
---

# `<MatchAnnouncer>`

```tsx
import { MatchAnnouncer } from 'one-more-highlight/a11y';
```

A debounced `role="status"` live region that announces result count and
navigation position. This is a different problem from highlight semantics
(see [`<AccessibleHighlight>`](./accessible-highlight)): even with a perfect
semantic bridge between the visual highlight and assistive technology, a
keyboard user navigating results still has no way to know where they are
without an announcement like this.

`<MatchAnnouncer>` takes `matchCount`, `activeIndex`, and `activeMatchText`
**explicitly**, rather than owning navigation state itself — it is a pure
presentation of whatever counting/navigation state you already have from
`useHighlight` and/or `useRovingMatchFocus`.

## Signature

```ts
interface MatchAnnouncerProps {
  /** Total number of matches, e.g. from `getMatchCount()`. */
  matchCount: number;
  /** Zero-based index of the current match, or `null` if none is active. */
  activeIndex: number | null;
  /** Text of the active match, e.g. from `getMatchByIndex(activeIndex)?.text`. */
  activeMatchText?: string;
  /** Debounce before announcing, so rapid navigation doesn't spam the region. Defaults to 150ms. */
  debounceMs?: number;
}
```

## Wiring it up

```tsx
import { useState } from 'react';
import { useHighlight } from 'one-more-highlight';
import { MatchAnnouncer } from 'one-more-highlight/a11y';

function SearchResults({ text, searchWords }: { text: string; searchWords: string[] }) {
  const { getMatchCount, getMatchByIndex } = useHighlight({ text, searchWords });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const matchCount = getMatchCount();
  const activeMatchText = activeIndex !== null ? getMatchByIndex(activeIndex)?.text : undefined;

  return (
    <>
      {/* ...render matches, update activeIndex on navigation... */}
      <MatchAnnouncer
        matchCount={matchCount}
        activeIndex={activeIndex}
        {...(activeMatchText !== undefined && { activeMatchText })}
      />
    </>
  );
}
```

Composed with [`useRovingMatchFocus`](./use-roving-match-focus)'s
`onActiveChange`, the announcer stays in sync with keyboard navigation
without either hook needing to know about the other.

## Announced messages

| State | Message |
|---|---|
| `matchCount === 0` | `"No results"` |
| `activeIndex` is `null`, matches exist | `"{matchCount} result(s)"` |
| `activeIndex` set | `"Result {activeIndex + 1} of {matchCount}"`, plus `. {activeMatchText}` when provided |

## Debounce and SSR

The announcement is set on a `setTimeout` debounced by `debounceMs` (default
150ms) so rapid navigation (e.g. holding an arrow key) doesn't spam the live
region with every intermediate index. On the server the timer never fires,
so `<MatchAnnouncer>` renders an empty `role="status"` region — this is
intentional and matches what the client renders before the debounce
resolves, so there is no hydration mismatch.
