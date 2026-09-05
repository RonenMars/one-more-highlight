---
sidebar_position: 1
---

# CSS Custom Highlight API engine

`one-more-highlight/css` ships an opt-in rendering engine that paints
highlights via the [CSS Custom Highlight API](https://developer.mozilla.org/docs/Web/API/CSS_Custom_Highlight_API)
instead of `<mark>` DOM nodes. The matching pipeline is identical — only
the render step differs.

## When to use it

- **Long text** (≥ 50 KB or thousands of matches). Range-based painting
  avoids per-match DOM nodes, giving a large perf win.
- **DOM-sensitive consumers** — copy-paste, `MutationObserver`-based
  tooling, and React reconciliation see only a single Text node.

For short text or when you need `renderMatch` / custom tags, the default
`<Highlight>` engine remains the right choice.

## Opt in

```tsx
import { CssHighlight } from 'one-more-highlight/css';

<CssHighlight text={longArticle} searchWords={['fox', 'dog']} />;
```

You **also** need to write CSS — the library does not synthesize styles.

```css
::highlight(match)  { background: #FFF166; color: #1b1b1d; }
::highlight(active) { background: #A8FF80; color: #1b1b1d; }
::highlight(pinned) { background: #FFADD6; color: #1b1b1d; }
```

The `match` name is implicit — it's where matches with no `states` end up.

## Controlled ranges

`<CssHighlight>` takes the same mutually exclusive source union as
`<Highlight>` — either `searchWords` or `ranges`, never both. Precomputed
offsets and this engine pair well: the ranges you pass are painted as
`Range` objects with no DOM nodes created at all, which is the cheapest path
for a long document with many server-supplied hits.

```tsx
<CssHighlight
  text={longArticle}
  ranges={hits.map((h) => ({ start: h.from, end: h.to, termId: h.query }))}
  states={[{ name: 'strong', match: (m) => Number(m.range.metadata?.score) >= 0.85 }]}
/>;
```

```css
::highlight(match)  { background: #FFF166; color: #1b1b1d; }
::highlight(strong) { background: #A8FF80; color: #1b1b1d; }
```

Clamping, dropping of malformed ranges, `termId` grouping and predicate
selectors behave exactly as they do on the DOM engine — the pipeline is
shared, only the paint step differs. See the
[controlled ranges guide](/docs/guides/controlled-ranges).

Two details specific to this engine:

- **State names still drive the CSS.** A state's `className` / `style` is
  ignored here, so style each state through `::highlight(name)`. Matches with
  no state land in the implicit `match` highlight.
- **The wrapper must stay a single text node.** Ranges are set against the
  wrapper's first child text node, so this engine renders `text` verbatim —
  one more reason offsets index the string exactly as `slice` does.

## Multi-state composition

The library registers one `Highlight` per state name:

```tsx
<CssHighlight
  text={text}
  searchWords={['cat']}
  states={[
    { name: 'active', index: 2 },
    { name: 'pinned', indices: [3, 5] },
  ]}
/>
```

Stacking order is controlled by [`highlight-order`](https://developer.mozilla.org/docs/Web/CSS/highlight-order)
in your CSS:

```css
:root {
  highlight-order: active, pinned, match;
}
```

Higher-priority highlights paint on top. The library does not encode
priority — it is the author's responsibility.

## `fallback` prop

```tsx
<CssHighlight ... fallback="dom" />   // default
<CssHighlight ... fallback="none" />
<CssHighlight ... fallback="throw" />
```

| Value | Behavior in unsupported browsers (e.g., Firefox < 140) |
| --- | --- |
| `'dom'` (default) | Internally renders via the DOM `<Highlight>` engine. Visually identical to the default component. |
| `'none'` | Renders plain text wrapper with no highlights. |
| `'throw'` | Throws on first render with a clear message. Opt-in for strict consumers. |

## Refs

`<CssHighlight>` is wrapped with `forwardRef` — pass a `ref` and it
attaches to the root wrapper element (the `as` element, default `<span>`).
In the DOM-fallback branch the ref still resolves to the wrapper, so
consumer code can hold a single ref shape regardless of which engine
runs.

```tsx
import { useRef } from 'react';
import { CssHighlight } from 'one-more-highlight/css';

function Article() {
  const ref = useRef<HTMLSpanElement>(null);
  return <CssHighlight ref={ref} text={text} searchWords={['fox']} />;
}
```

## Namespace scoping

`CSS.highlights` is a global registry — two `<CssHighlight>` instances on
the same page using the state name `active` share that bucket and paint
identically. If you need per-instance scoping, prefix your state names
yourself (e.g., `chat-active`, `feed-active`).

## Limitations vs. the DOM engine

| Feature | DOM `<Highlight>` | CSS `<CssHighlight>` |
| --- | :---: | :---: |
| `renderMatch` prop | ✅ | ❌ |
| `highlightTag` prop | ✅ | ❌ |
| `unhighlightTag` prop | ✅ | ❌ |
| Inline `style` / `className` on `HighlightState` | ✅ | ❌ (use `::highlight(name)` CSS instead) |
| `as`, `className`, `style` on the wrapper | ✅ | ✅ |
| Multi-state stacking | ✅ (via `className` array on `<mark>`) | ✅ (via `highlight-order` CSS) |
| Server-side rendering | ✅ | ✅ (wrapper + Text node only) |
| Browser support | Universal | [Chromium 105+, Safari 17.2+, Firefox 140+](https://caniuse.com/?search=CSS%20Custom%20Highlight%20API) |

## Rapid-update edge case

If your app mutates `text` so fast that React batches two updates, the
previous effect's cleanup and the new effect's setup happen in the same
microtask. `CSS.highlights` reflects the final state correctly — there is
no interleaved-paint problem because layout effects run before paint.
You don't need to do anything special. This note exists so you know the
timing guarantee.

## Bundle impact

The `/css` entry is its own tree-shaking root — consumers of the default
`one-more-highlight` entry pay nothing for the CSS engine.

## Accessibility

A painted range creates **no DOM**, so `<mark>`'s semantics are not available
here. The engine's only accessibility affordance is `Highlight.type`, which the
`highlightType` prop sets:

```tsx
<CssHighlight text={body} searchWords={q} highlightType="spelling-error" />
```

| Value | Meaning |
| --- | --- |
| `'highlight'` *(default)* | General highlight, no specific semantics |
| `'spelling-error'` | Assistive technology can announce a misspelling |
| `'grammar-error'` | Assistive technology can announce a grammar problem |

### Screen-reader support is real, but uneven

This is better than commonly assumed and worse than complete. Per the CSS
Working Group's status report of March 2026:

| Platform | `highlight` | `spelling-error` | `grammar-error` |
| --- | --- | --- | --- |
| Windows — Narrator, NVDA, JAWS | ✅ | ✅ | ✅ |
| macOS | ✅ | ✅ | ❌ in progress |
| Linux | ❌ in progress | ✅ | ✅ |
| Safari | unknown | unknown | unknown |

So the default `'highlight'` type **is** announced on Windows and macOS, and is
not on Linux. NVDA on Firefox announces all three.

One caveat on reading that table: the working group's report says "custom"
where the specification's enum says `'highlight'`. Everything else lines up, so
they are almost certainly the same thing, but we have not seen the equivalence
stated outright.

### Choosing an engine

If a highlight carries meaning a user must not miss — search results they are
navigating, errors they must act on — prefer the DOM engine, or
`one-more-highlight/a11y`, which makes the accessible layer explicit.

Reach for this engine when highlights are decorative or supplementary, or when
the performance win on long text matters more than announcement on Linux.

There is no per-match DOM to attach `aria-*` to, and adding one would remove the
only reason to use this engine. That trade is the point, not an oversight.
