---
sidebar_position: 5
---

# `<AccessibleHighlight>`

```tsx
import { AccessibleHighlight } from 'one-more-highlight/a11y';
```

A drop-in replacement for `<Highlight>` — it accepts every `HighlightProps`
prop, plus `mode` and `engine`. DOM `<mark>` and CSS Custom Highlights give
assistive technology different (unequal) results; these props make that
choice explicit rather than accidental.

`mode` decides what assistive technology gets. `engine` decides what paints
the pixels. They are independent: **a given `mode` produces the same
accessible output under either engine.**

## Signature

```ts
type AccessibilityMode = 'native' | 'dual' | 'annotated';
type HighlightEngine = 'dom' | 'css';

interface AccessibleHighlightProps extends HighlightProps {
  /** Defaults to `'native'`. */
  mode?: AccessibilityMode;
  /** Defaults to `'dom'`. */
  engine?: HighlightEngine;
  /** Unsupported-browser behaviour of the CSS engine. `engine="css"` only. */
  fallback?: 'dom' | 'none' | 'throw';
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

## The `engine` prop — semantic parity with the CSS engine

```tsx
<AccessibleHighlight text={text} searchWords={['cat']} mode="dual" engine="css" />
```

`<CssHighlight>` paints matches through the CSS Custom Highlight API. Those
painted ranges have **no DOM at all**, so on its own the CSS engine gives
assistive technology nothing — switching engines for the performance win
silently drops every semantic affordance.

`engine="css"` closes that gap. It renders the painted layer `aria-hidden`
and puts the accessible layer beside it, visually hidden — so the accessible
output for a given `mode` is identical to `engine="dom"`. That holds in
browsers without CSS Custom Highlight support too: the CSS engine's DOM
fallback lands inside the `aria-hidden` layer, where it cannot change what
assistive technology reads.

You still author the visual styling with `::highlight(name)` — see the
[CSS engine page](../engines/css-highlights.md). `highlightTag`,
`renderMatch` and per-state `className` / `style` do not reach the painted
layer.

### What it costs

Element counts for a wrapper containing *N* matches, measured in a browser
that supports the API:

| `mode` | `engine="dom"` | `engine="css"` |
|---|---|---|
| `'native'` | 1 + *N* | 5 + *N* |
| `'dual'` | 4 + *N* | **4 — constant** |
| `'annotated'` | 1 + 3*N* | 5 + 3*N* |

Under `engine="css"` the text is always in the DOM twice — once in the
painted layer, once in the accessible one. Under `engine="dom"` only
`mode="dual"` duplicates it.

**`mode="dual"` is the mode to use with `engine="css"`.** It is the only
combination that keeps the CSS engine's reason to exist: its accessible
layer is one unbroken copy of the text, so the node count does not move as
matches are added — 4 elements whether there is 1 match or 500.

`mode` still defaults to `'native'` under `engine="css"` — deliberately. If
the default flipped with the engine, adding `engine="css"` to an existing
component would quietly change what assistive technology reads, which is the
exact failure this prop exists to prevent. Set `mode="dual"` explicitly.

`'native'` and `'annotated'` reach parity by rendering, hidden, exactly the
`<mark>` tree the DOM engine would have rendered. The per-match node count
is therefore the same as the DOM engine's, plus four wrapper elements and a
second copy of the text — which means `engine="css"` in those two modes is
strictly more DOM than `engine="dom"`. Reach for them only when you need
`::highlight()` painting specifically (unfragmented visible text runs); if
you just want accessible highlights, `engine="dom"` is cheaper.

## Refs

`<AccessibleHighlight>` is wrapped with `forwardRef` — pass a `ref` and it
attaches to the root `<span>` in every mode.
