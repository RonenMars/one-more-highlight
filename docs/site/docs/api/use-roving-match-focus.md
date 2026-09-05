---
sidebar_position: 7
---

# `useRovingMatchFocus`

```tsx
import { useRovingMatchFocus } from 'one-more-highlight/navigation';
```

Standard [roving tabindex](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex)
for keyboard-navigating matches: one match is in the tab order at a time,
and arrow keys move both the roving index and DOM focus between matches.

## Signature

```ts
function useRovingMatchFocus(options: UseRovingMatchFocusOptions): UseRovingMatchFocusResult

interface UseRovingMatchFocusOptions {
  /** Total number of matches, e.g. from `getMatchCount()`. */
  matchCount: number;
  /** Look up the DOM node for a match, e.g. `useHighlight()`'s `getMatchNode`. */
  getMatchNode: (matchIndex: number) => ScrollableMatchNode | null;
  /** Called after the active index changes, e.g. to drive a live-region announcement. */
  onActiveChange?: (matchIndex: number) => void;
}

interface UseRovingMatchFocusResult {
  /** Index of the match currently in the tab order. */
  activeIndex: number;
  /** `0` for the active match, `-1` for every other — standard roving tabindex. */
  getTabIndex: (matchIndex: number) => 0 | -1;
  /** Attach to each match node's `onKeyDown`. Arrow keys move focus; Home/End jump to the ends. */
  handleKeyDown: (event: KeyboardEvent) => void;
  /** Imperatively move the roving focus (and DOM focus) to `matchIndex`. */
  focusMatch: (matchIndex: number) => void;
}
```

## Keyboard behavior

| Key | Action |
|---|---|
| `ArrowRight` / `ArrowDown` | Move to the next match, wrapping to the first after the last. |
| `ArrowLeft` / `ArrowUp` | Move to the previous match, wrapping to the last after the first. |
| `Home` | Jump to the first match. |
| `End` | Jump to the last match. |

## Composing with `useHighlight`'s `getMatchNode`

`useRovingMatchFocus` needs a way to find and focus a match's underlying DOM
node — it depends on `useHighlight`'s node registry rather than owning one
itself. Attach `matchRef(matchIndex)` to each rendered match (e.g. via
`renderMatch`) and pass `getMatchNode` straight through:

```tsx
import { useHighlight } from 'one-more-highlight';
import { useRovingMatchFocus } from 'one-more-highlight/navigation';

function SearchResults({ text, searchWords }: { text: string; searchWords: string[] }) {
  const { segments, getMatchCount, matchRef, getMatchNode } = useHighlight({
    text,
    searchWords,
  });
  const { getTabIndex, handleKeyDown } = useRovingMatchFocus({
    matchCount: getMatchCount(),
    getMatchNode,
  });

  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={`${seg.start}-${seg.end}-${i}`}
            ref={matchRef(seg.matchIndex)}
            tabIndex={getTabIndex(seg.matchIndex)}
            onKeyDown={handleKeyDown}
          >
            {seg.text}
          </mark>
        ) : (
          seg.text
        ),
      )}
    </>
  );
}
```

A match must expose `.focus()` to be reachable this way — any real DOM
element does once it carries a `tabIndex` (even `-1`), which
`getTabIndex` provides.

## Pairing with `<MatchAnnouncer>`

Pass `onActiveChange` to drive [`<MatchAnnouncer>`](./match-announcer)'s
`activeIndex` without either hook needing to know about the other:

```tsx
const [activeIndex, setActiveIndex] = useState(0);
const { getTabIndex, handleKeyDown } = useRovingMatchFocus({
  matchCount: getMatchCount(),
  getMatchNode,
  onActiveChange: setActiveIndex,
});
```
