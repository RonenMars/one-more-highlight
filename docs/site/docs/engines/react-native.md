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
