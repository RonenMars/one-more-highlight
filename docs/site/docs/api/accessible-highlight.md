---
sidebar_position: 5
---

# `<AccessibleHighlight>`

```tsx
import { AccessibleHighlight } from 'one-more-highlight/a11y';
```

A drop-in replacement for `<Highlight>` — it accepts every `HighlightProps`
prop, plus a `mode` prop. DOM `<mark>` and CSS Custom Highlights give
assistive technology different (unequal) results; `mode` makes that choice
explicit rather than accidental.

## Signature

```ts
type AccessibilityMode = 'native' | 'dual' | 'annotated';

interface AccessibleHighlightProps extends HighlightProps {
  /** Defaults to `'native'`. */
  mode?: AccessibilityMode;
}
```

## Modes

| Mode | What renders | When to use |
|---|---|---|
| `'native'` (default) | Identical to `<Highlight>` — unchanged. | Screen readers that announce `<mark>` adequately, or when you're not sure yet — it's the safe default. |
| `'dual'` | A fragmented, `aria-hidden` visual layer plus a visually-hidden, unbroken copy of the full text for assistive technology to read. | Screen readers that announce every fragment boundary in the DOM layer, making highlighted text choppy to listen to. The unbroken copy reads naturally, at the cost of not conveying *which* words are highlighted to AT users. |
| `'annotated'` | The visual layer stays in the accessibility tree; each match gets visually-hidden "highlight start" / "highlight end" boundary text. | You want AT users to know *where* a highlight begins and ends, without a duplicate text copy. |

```tsx
<AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode="dual" />
```

## The `annotated` limitation

`mode="annotated"` renders matches itself — it needs to splice the boundary
markers around each match's children, so it does not delegate to
`<Highlight>` internally. As a result, **`highlightTag` and `renderMatch` are
silently ignored in this mode.** Matches always render as `<mark>`.

`'native'` and `'dual'` both honor `highlightTag` and `renderMatch` normally
(via the underlying `<Highlight>`).

If you need a custom tag or full render-prop control *and* boundary markers,
use `'dual'` with your own custom markers inside the visually-hidden copy, or
file a request — this is a known gap, not an oversight.

## Semantic parity with the CSS engine

`<AccessibleHighlight>` only wraps the DOM `<Highlight>` engine. Bringing
these modes to `<CssHighlight>` (`one-more-highlight/css`) is tracked
separately and is out of scope here — see the project's issue tracker for
the CSS-engine accessibility work.

## Refs

`<AccessibleHighlight>` is wrapped with `forwardRef` — pass a `ref` and it
attaches to the root `<span>` in every mode.
