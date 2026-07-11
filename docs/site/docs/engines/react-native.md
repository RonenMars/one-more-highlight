---
sidebar_position: 2
---

# React Native engine

`one-more-highlight/native` ships an opt-in rendering engine for React
Native. Matches render as nested `<Text>` runs inside a container
`<Text>`. The matching pipeline is identical to the web engines — same
selectors, overlap strategies, and multi-state styling — only the render
step differs.

## Opt in

`react-native` is an **optional peer dependency** — it is pulled in only
when you import `/native`, so web-only consumers are unaffected.

```tsx
import { HighlightText } from 'one-more-highlight/native';

<HighlightText
  text="the quick brown fox"
  searchWords={['quick', 'fox']}
  highlightStyle={{ backgroundColor: '#FFF166' }}
  states={[{ name: 'active', term: 'fox', style: { fontWeight: 'bold' } }]}
/>;
```

## Styling

React Native has no `className` — style with `highlightStyle`,
`unhighlightStyle`, and `HighlightState.style`, all `StyleProp<TextStyle>`.
Per-state styles cascade in declaration order — the last matching state
wins, same as the web engine.

```tsx
<HighlightText
  text={text}
  searchWords={['cat']}
  highlightStyle={{ backgroundColor: '#FFF166' }}
  states={[
    { name: 'active', index: 2, style: { backgroundColor: '#A8FF80' } },
    { name: 'pinned', indices: [3, 5], style: { backgroundColor: '#FFADD6' } },
  ]}
/>
```

## `renderMatch`

Full control over a match. Receives the segment and the merged
highlight + per-state style:

```tsx
import { Text } from 'react-native';

<HighlightText
  text={text}
  searchWords={['fox']}
  renderMatch={(seg, { style }) => (
    <Text style={style} onPress={() => focus(seg.matchIndex)}>
      {seg.text}
    </Text>
  )}
/>;
```

## Container props and refs

- `style` styles the outer container `<Text>`.
- `textProps` forwards everything else to the container —
  `numberOfLines`, `onPress`, `accessibilityLabel`, and so on.
- `<HighlightText>` is wrapped with `forwardRef` — a `ref` attaches to
  the container `<Text>`.

## Headless hook

`useHighlight` has no platform dependency — render the segments however
you like:

```tsx
import { Text } from 'react-native';
import { useHighlight } from 'one-more-highlight/native';

function Highlighted({ text, term }: { text: string; term: string }) {
  const { segments } = useHighlight({ text, searchWords: [term] });
  return (
    <Text>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <Text key={i} style={{ backgroundColor: '#FFF166' }}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      )}
    </Text>
  );
}
```

## Scroll to a match

Match `<Text>` runs are virtual nodes — no `onLayout`, no host handle —
and RN exposes no substring measurement, so the finest primitive
available is **the box of the line a match falls on, relative to the
root `<Text>`**. `onMatchesLayout` hands you exactly that, derived from
the already-computed match offsets (no re-running `indexOf`):

```tsx
onMatchesLayout={(matches) => {
  // matches: { matchIndex, termIndex, start, end, lineIndex, y, height }[]
  // `y` / `height` = the line's box relative to the root Text's top.
}}
```

- Fires on `onTextLayout` **and** whenever `searchWords`/segments change
  even if the layout doesn't (RN wouldn't re-fire `onTextLayout` when
  `text` is unchanged), so offsets never go stale.
- Emits `[]` when a re-match finds nothing, so you can clear state.
- A match that wraps across lines reports its **first** line.
- Under `numberOfLines` truncation, only matches on rendered lines are
  meaningful — RN reports layout for rendered lines only.
- Composes with a `textProps.onTextLayout` you supply (both run).

For a full scroll-to-match against a list row, resolve the match into
the row's coordinate space with the imperative `layoutRef`:

```tsx
import { useRef } from 'react';
import { View, Text } from 'react-native';
import { HighlightText } from 'one-more-highlight/native';
import type { HighlightLayoutHandle } from 'one-more-highlight/native';

function Row({ text, needle, listRef }) {
  const layout = useRef<HighlightLayoutHandle>(null);
  const rowRef = useRef<View>(null);

  async function scrollToMatch() {
    // Measure the "active" match's line against the list row, then scroll.
    const box = await layout.current?.measureMatch(0, rowRef);
    if (box) listRef.current?.scrollToOffset({ offset: box.y });
  }

  return (
    <View ref={rowRef}>
      <HighlightText
        text={text}
        searchWords={[needle]}
        states={[{ name: 'active', index: 0 }]}
        layoutRef={layout}
      />
    </View>
  );
}
```

- `getMatchLayout(matchIndex)` → sync, from cached layout:
  `{ start, end, lineIndex, y, height } | null` (null before the first
  layout or for an unknown index).
- `measureMatch(matchIndex, relativeTo?)` → async: composes the root
  Text's `measureLayout` (against `relativeTo`) or `measure` (window)
  with the cached line-y, resolving the match's coords in ancestor or
  window space. Leave converting that to list/window scroll offsets to
  you — absolute coords go stale every scroll frame.
- `layoutRef` is separate from `ref` (which still forwards the raw
  container `<Text>`), so existing `ref` consumers are unaffected.

Web has no equivalent: DOM matches are real elements there, so
`scrollIntoView` already covers scroll-to-match.

## Differences from the DOM engine

- **No `className`.** Styles are `StyleProp<TextStyle>` objects.
- **No `<mark>` / `role="mark"`.** React Native has no `mark`
  accessibility role. For an accessible callout, pass
  `accessibilityLabel` via `textProps`, or use `renderMatch` to render
  your own node.
- **No CSS Custom Highlight API engine.** `/css` is web-only; there is
  no RN analog.

## Platform caveats

Background color, line height, and vertical alignment of nested text
spans behave differently across iOS and Android. Android in particular
shifts the baseline when a span changes `fontSize`, and does not clip
`borderRadius` on text spans. `numberOfLines` truncation is controlled
by the outer container `<Text>` via `textProps`.

## Metro resolution

New Metro (RN 0.79+) resolves the `/native` subpath via the package
`exports` map. Older Metro resolves it through a bundled path shim, so
no configuration is needed either way.

## Bundle impact

The `/native` entry is its own tree-shaking root — web consumers pay
nothing for it, and the RN entry ships at ~2 KB brotlied.
