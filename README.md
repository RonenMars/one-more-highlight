# one-more-highlight

> Multi-state substring highlighting for React.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-First--class-blue.svg)](#)
[![bundle](https://img.shields.io/badge/bundle-2.1KB%20brotlied-green.svg)](#)
[![tests](https://img.shields.io/badge/tests-52%20passing-green.svg)](#)

Highlight every occurrence of a substring in one style, **and** highlight specific occurrences — by **single index**, **index range**, or **arbitrary list of indices** — in another style. TypeScript-first, headless-friendly, ~2KB brotlied, zero CSS shipped.

> *Dedicated to Chester Bennington. Inspired by the idea that every small light matters.*
>
> — *"I tried so hard and got so far…"* — we built this so the right words could shine.

---

## Why this exists

**`one-more-highlight`** gives you:

- **TypeScript-first** — full types, discriminated unions, `match.one/range/many` builders that narrow correctly.
- **Multi-state styling** as the headline feature — every match gets a base style, plus layered styles selected by index, range, or arbitrary list. Styles compose.
- **Headless `useHighlight` hook** alongside the `<Highlight>` component, with a `renderMatch` render-prop for full per-match control.
- **Tiny** — 2.1 KB brotlied (ESM), 2 microscopic deps (`clsx` + `escape-string-regexp`).
- **Modern** — React 18+/19, ESM + CJS dual build with `.d.ts` + `.d.cts`, tree-shakeable, SSR-safe.

```tsx
import { Highlight, match } from 'one-more-highlight';

<Highlight
  text="time time time time time"
  searchWords={['time']}
  highlightClassName="bg-yellow-200"
  states={[
    { name: 'active',     ...match.one(2),       className: 'bg-orange-500 ring-2' },
    { name: 'preview',    ...match.range(0, 1),  className: 'bg-blue-100' },
    { name: 'bookmarked', ...match.many([3, 4]), className: 'underline' },
  ]}
/>
```

A single match can be in multiple states at once; their `className`s concatenate and their `style`s shallow-merge.

## Install

```bash
pnpm add one-more-highlight
# or: npm i one-more-highlight / yarn add one-more-highlight
```

Peer: `react >= 18`. Runtime deps: `clsx`, `escape-string-regexp` (both MIT, ~400 B combined).

## Usage

### Component (drop-in)

```tsx
import { Highlight } from 'one-more-highlight';

<Highlight text="hello world" searchWords={['world']} />
// → "hello <mark>world</mark>"
```

### Headless hook (DIY rendering)

```tsx
import { useHighlight } from 'one-more-highlight';

function MyHighlighter({ text, query }: { text: string; query: string }) {
  const segments = useHighlight({ text, searchWords: [query] });
  return (
    <p>
      {segments.map((s, i) =>
        s.isMatch ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>,
      )}
    </p>
  );
}
```

### Multi-state styling (the headline feature)

```tsx
import { Highlight, match } from 'one-more-highlight';

<Highlight
  text={longText}
  searchWords={['React']}
  highlightClassName="hl-base"
  states={[
    { name: 'active',     ...match.one(activeIdx),  className: 'hl-active' },
    { name: 'recent',     ...match.range(0, 4),     className: 'hl-recent' },
    { name: 'bookmarked', ...match.many(bookmarks), className: 'hl-bookmark' },
  ]}
/>
```

Every match gets `hl-base`. Match `activeIdx` *also* gets `hl-active`. Matches 0–4 *also* get `hl-recent`. Matches in `bookmarks` *also* get `hl-bookmark`. Classes concatenate, styles shallow-merge in declaration order.

### Render-prop for full per-match control

```tsx
<Highlight
  text={text}
  searchWords={['error']}
  states={[{ name: 'active', ...match.one(2) }]}
  renderMatch={(seg, { className, style, Tag }) => (
    <Tag className={className} style={style}>
      {seg.text}
      {seg.states.includes('active') && <ActiveBadge />}
    </Tag>
  )}
/>
```

`renderMatch` receives the resolved className/style/Tag for the match. Return whatever React node you want — string, fragment, custom element, null (renders raw text).

## API

### `<Highlight>` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | required | The text to highlight inside. |
| `searchWords` | `Array<string \| RegExp>` | required | Terms to find. RegExps are cloned with `g` flag forced on. |
| `caseSensitive` | `boolean` | `false` | Match case (string terms only; regex flags are honored). |
| `autoEscape` | `boolean` | `true` | Escape regex special chars in string terms. |
| `sanitize` | `(s: string) => string` | — | Pre-process text and search source before matching (e.g. for diacritic-insensitive search). |
| `findChunks` | `(input) => RawChunk[]` | — | Custom matcher; replaces the default. |
| `states` | `HighlightState[]` | — | Per-match layered styling. See below. |
| `overlapStrategy` | `'merge' \| 'nest' \| 'first-wins'` | `'merge'` | How to handle overlapping matches. |
| `highlightTag` | `keyof JSX.IntrinsicElements \| Component` | `'mark'` | Element/component for matches. Custom components receive `matchIndex` and `states` props. |
| `highlightClassName` | `string` | — | Base className for every match. |
| `highlightStyle` | `CSSProperties` | — | Base inline style for every match. |
| `unhighlightTag` | `keyof JSX.IntrinsicElements` | — | Element to wrap non-matches (default: no wrapper). |
| `unhighlightClassName` | `string` | — | className for non-matches (only applied if `unhighlightTag` is set). |
| `unhighlightStyle` | `CSSProperties` | — | Inline style for non-matches. |
| `renderMatch` | `(seg, defaults) => ReactNode` | — | Full render-prop control over match output. |
| `as` | `keyof JSX.IntrinsicElements` | `'span'` | Root wrapper element. |
| `className` | `string` | — | className on the root wrapper. |
| `style` | `CSSProperties` | — | Inline style on the root wrapper. |

### `useHighlight(options)` → `Segment[]`

Same options as `<Highlight>` minus the rendering props. Returns alternating `MatchSegment` / `TextSegment` covering the full text.

```ts
type Segment = MatchSegment | TextSegment;

interface MatchSegment {
  text: string;
  isMatch: true;
  matchIndex: number;        // 0-based document order
  start: number;             // index in original text
  end: number;
  states: ReadonlyArray<string>;  // names of states this match belongs to
}

interface TextSegment {
  text: string;
  isMatch: false;
  start: number;
  end: number;
}
```

### `HighlightState` selector forms

```ts
import { match } from 'one-more-highlight';

match.one(2)          // → { index: 2 }
match.range(4, 6)     // → { range: [4, 6] }   (inclusive both ends)
match.many([0, 4, 7]) // → { indices: [0, 4, 7] }
```

Spread one of these into a `HighlightState`:

```ts
const states = [
  { name: 'active', ...match.one(2), className: 'is-active' },
  { name: 'preview', ...match.range(0, 1), style: { background: '#fef9c3' } },
];
```

## Behavior notes

- **Overlapping matches** default to `merge` (collapsed into one segment). Choose `nest` to keep each match individually addressable, or `first-wins` to drop later overlaps.
- **Indexing is global document order.** Match #0 is the first match in the text regardless of which `searchWords` entry produced it.
- **Out-of-range state indices** are silently ignored in production; a one-time `console.warn` fires in dev mode.
- **Regex defenses**: consumer-supplied `RegExp` is always cloned, the `g` flag is forced on, and the sticky `y` flag is dropped (with a dev warning). This prevents the mutable-`lastIndex` footgun.
- **Accessibility**: default `<mark>` carries native `mark` semantics. When `highlightTag` is overridden to a non-semantic element, `role="mark"` is added automatically.
- **SSR**: pipeline contains no `window`/`document` reads and produces deterministic markup.

## Roadmap

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the full v2+ plan. Short version:

- **CSS Custom Highlight API** rendering engine — ~10× perf on long text
- **Per-search-term indexing** (`{ term: 'cat', index: 1 }`)
- **Grapheme-aware matching** via `Intl.Segmenter`
- **Fuzzy matching** (Levenshtein)
- **Stable match IDs** for references that survive data changes

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Bug reports and edge-case fuzz cases especially welcome.

## License

MIT © Ronen Mars. See [`LICENSE`](./LICENSE).

---

> *"In the end, it doesn't even matter"* — except when it does.
> Every match. Every word. Every voice that mattered.
> R.I.P. Chester. 🤍
