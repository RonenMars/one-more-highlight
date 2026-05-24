<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/banner-dark.svg">
  <img src="./docs/assets/banner-light.svg" alt="one-more-highlight — Multi-state substring highlighting for React" width="100%">
</picture>

# omh · one-more-highlight

> Multi-state substring highlighting for React.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/one-more-highlight.svg)](https://www.npmjs.com/package/one-more-highlight)
[![npm downloads](https://img.shields.io/npm/dm/one-more-highlight.svg)](https://www.npmjs.com/package/one-more-highlight)
[![CI](https://img.shields.io/github/actions/workflow/status/ronenmars/one-more-highlight/ci.yml?branch=main&label=CI)](https://github.com/ronenmars/one-more-highlight/actions)
[![Latest release](https://img.shields.io/github/v/release/ronenmars/one-more-highlight?label=release)](https://github.com/ronenmars/one-more-highlight/releases/latest)
[![types](https://img.shields.io/npm/types/one-more-highlight.svg)](https://www.npmjs.com/package/one-more-highlight)
[![React](https://img.shields.io/npm/dependency-version/one-more-highlight/peer/react?label=react)](https://www.npmjs.com/package/one-more-highlight?activeTab=dependencies)

> *Dedicated to Chester Bennington. Inspired by the idea that every small light matters.*
>
> — *"I tried so hard and got so far…"* — we built this so the right words could shine.

---

## Why this exists

**`one-more-highlight`** gives you:

- **TypeScript-first** — full types and a discriminated-union `HighlightState` that narrows correctly on the selector field (`index`, `range`, or `indices`).
- **Multi-state styling** as the headline feature — every match gets a base style, plus layered styles selected by index, range, or arbitrary list. Styles compose.
- **Headless `useHighlight` hook** alongside the `<Highlight>` component, with a `renderMatch` render-prop for full per-match control.
- **Tiny** — ~2 KB brotlied (ESM), 2 microscopic deps (`clsx` + `escape-string-regexp`).
- **Modern** — React 18+/19, ESM + CJS dual build with `.d.ts` + `.d.cts`, tree-shakeable, SSR-safe.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/multi-state-demo-dark.svg">
  <img src="./docs/assets/multi-state-demo-light.svg" alt="Animated demo: yellow base highlight on all React matches, then pink underline on match 2, then green tint on matches 0-1, then dotted underline on matches 0 and 2." width="100%">
</picture>

## Install

```bash
pnpm add one-more-highlight
# or: npm i one-more-highlight / yarn add one-more-highlight
```

Peer: `react >= 18`. Runtime deps: `clsx`, `escape-string-regexp` (both MIT, ~400 B combined).

## Quick start

```tsx
import { Highlight } from 'one-more-highlight';

<Highlight
  text="time time time time time"
  searchWords={['time']}
  highlightClassName="bg-yellow-200"
  states={[
    { name: 'active',     index: 2,         className: 'bg-orange-500 ring-2' },
    { name: 'preview',    range: [0, 1],    className: 'bg-blue-100' },
    { name: 'bookmarked', indices: [3, 4],  className: 'underline' },
  ]}
/>
```

A single match can be in multiple states at once; their `className`s concatenate and their `style`s shallow-merge in declaration order.

## Engines

`one-more-highlight` ships two rendering engines that share the same matching pipeline. The default `<Highlight>` from `'one-more-highlight'` wraps each match in a DOM node; `<CssHighlight>` from `'one-more-highlight/css'` paints via the CSS Custom Highlight API with zero per-match DOM nodes (faster on long text).

See [engines/css-highlights](https://one-more-highlight.vercel.app/docs/engines/css-highlights).

## Browser & runtime

React 18+/19, Node 18+, modern evergreens (Chrome 112+, Firefox 140+, Safari 16.4+). Full matrix → [recipes/browser-support](https://one-more-highlight.vercel.app/docs/recipes/browser-support).

## Documentation

| Topic | Where |
| --- | --- |
| Getting started — install, intro, quick start | [docs site → getting-started](https://one-more-highlight.vercel.app/docs/getting-started/intro) |
| Guides — basic highlighting, headless hook, multi-state styling, render-prop | [docs site → guides](https://one-more-highlight.vercel.app/docs/guides/basic-highlighting) |
| API reference — `<Highlight>` props, `useHighlight`, types, `HighlightState` selectors | [docs site → api](https://one-more-highlight.vercel.app/docs/api/highlight-props) |
| Recipes — accessibility, diacritic-insensitive search, overlap strategies, browser support | [docs site → recipes](https://one-more-highlight.vercel.app/docs/recipes/accessibility) |
| Engines — CSS Custom Highlight API | [docs site → engines](https://one-more-highlight.vercel.app/docs/engines/css-highlights) |
| Roadmap (v2+ plan) | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| Architecture decisions | [`docs/adr/`](./docs/adr/) |

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Bug reports and edge-case fuzz cases especially welcome.

## License

MIT © Ronen Mars. See [`LICENSE`](./LICENSE).

---

> *"In the end, it doesn't even matter"* — except when it does.
> Every match. Every word. Every voice that mattered.
> R.I.P. Chester. 🤍
