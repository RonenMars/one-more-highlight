---
sidebar_position: 3
---

# Vanilla engine (no framework)

`one-more-highlight/vanilla` highlights text in any DOM subtree with no
framework at all. It reads the subtree, matches across element boundaries, and
paints with the CSS Custom Highlight API — falling back to `<mark>` injection
where that API is missing.

## When to use it

- You are not using React: plain JS, Vue, Svelte, Angular, Astro, a CMS theme, a
  browser extension.
- You need to highlight markup you do not own — a rendered article, search
  results, a third-party widget — rather than text you pass in as a string.
- You want the multi-state model over content that already exists in the page.

If you *are* rendering the text yourself in React, use `<Highlight>` or
`one-more-highlight/css` instead. They own their text node, so they skip the
walk entirely.

## Opt in

```bash
npm i one-more-highlight
```

```js
import { Highlighter } from 'one-more-highlight/vanilla';

const h = new Highlighter(document.querySelector('#article'));
const count = h.mark('time');
```

```css
::highlight(match) { background: #FFF166; color: #1b1b1d; }
```

`react` is an optional peer dependency — a non-React project installs nothing
extra.

## From a CDN, with no build step

The package ships an IIFE bundle (`dist/omh.global.js`) that defines a single
global, `OMH`. There is nothing to deploy — jsDelivr and unpkg mirror npm
automatically, so every published version is already there.

```html
<script src="https://cdn.jsdelivr.net/npm/one-more-highlight/dist/omh.global.js"></script>
<script>
  const h = new OMH.Highlighter(document.body);
  h.mark('time');
</script>
```

The package declares `unpkg` and `jsdelivr` fields pointing at that file, so the
bare URL resolves to it too:

```html
<script src="https://cdn.jsdelivr.net/npm/one-more-highlight"></script>
<script src="https://unpkg.com/one-more-highlight"></script>
```

The bundle is ~9 kB raw, **~3.2 kB brotlied over the wire**, with
`escape-string-regexp` inlined and `process.env` compiled out. Everything the
`Highlighter` API offers is on `OMH` — `Highlighter`, `highlight`, `TextIndex`,
`supported`, `defaultFindChunks`.

### Pin the version, and add an integrity hash

The examples above are unversioned, which is fine while you are trying it out and
wrong in production — the file changes under you on every release. Pin it:

```html
<script src="https://cdn.jsdelivr.net/npm/one-more-highlight@1.7.0/dist/omh.global.js"></script>
```

A pinned URL can also carry [Subresource Integrity][sri], so a compromised or
mistaken CDN response is rejected by the browser instead of executed. The hash
below is the real one for `1.7.0`; regenerate it whenever you move to a new
version:

```bash
curl -s https://cdn.jsdelivr.net/npm/one-more-highlight@1.7.0/dist/omh.global.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

```html
<script
  src="https://cdn.jsdelivr.net/npm/one-more-highlight@1.7.0/dist/omh.global.js"
  integrity="sha384-JGLvWQ+yeOWtQ9yyfV7aZJO2/hJnSGGHdXZZexQt8sXMz9dlqsm2KXW6xT0HTEa2"
  crossorigin="anonymous"></script>
```

`crossorigin="anonymous"` is required — without it the browser cannot read the
response to verify it, and the script is blocked. Note that SRI only works
against a **pinned** version: a range URL like `@1` serves different bytes over
time, so any hash you compute for it will start failing at the next release.

If you would rather have ESM than a global, `esm.sh` serves the real subpath:

```html
<script type="module">
  import { Highlighter } from 'https://esm.sh/one-more-highlight/vanilla';
  new Highlighter(document.body).mark('time');
</script>
```

[sri]: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

## Multi-state styling

Every state becomes a separately addressable CSS highlight. This is the same
`states` union the React entry takes, minus the DOM `style` field — under the
`css` renderer you style by name, so an inline style object has nowhere to go.

```js
h.mark('time', {
  states: [
    { name: 'active',  index: 2,        className: 'is-active' },
    { name: 'preview', range: [0, 1],   className: 'is-preview' },
    { name: 'flagged', indices: [0, 4], className: 'is-flagged' },
  ],
});
```

```css
::highlight(match)   { background: #FFF166; }
::highlight(active)  { background: #A8FF80; }
::highlight(preview) { background: #FFADD6; }
```

Under the `mark` renderer the same states contribute their `className` to the
injected element instead, and the element carries `data-omh-states="active"`.

### Highlight names are global to the document

This is the one thing about the `css` renderer that surprises people, and it is
not a quirk of this library — it is how the platform API works. `CSS.highlights`
is a **document-wide registry keyed by name**. Two `Highlighter` instances that
use the same state name write into the *same* bucket:

```js
// Both instances register under the name 'match'.
const a = new Highlighter(document.querySelector('#sidebar'));
const b = new Highlighter(document.querySelector('#article'));
a.mark('term');
b.mark('term');

a.unmark();   // b's highlights survive — each instance deletes only its own
              // ranges, and drops the name only once the bucket is empty.
```

Sharing a name is often exactly what you want: one `::highlight(match)` rule
styles every highlighter on the page. It becomes a problem when two instances
mean different things by the same name — a search highlighter and a
spell-checker both calling their state `'active'` will paint each other's
matches.

So when a page runs more than one highlighter for different purposes, namespace
the names:

```js
const search = new Highlighter(el, { name: 'search-match' });
search.mark(query, {
  states: [{ name: 'search-active', index: cursor }],
});
```

Teardown is reference-counted and per-instance, so instances that *do* share a
name coexist safely — `unmark()` removes only the ranges that instance added,
and deletes the registry entry only when nothing is left in it. The `mark`
renderer has no such consideration: it writes elements into the DOM it was given
and touches nothing else.

## Matching across element boundaries

The walker flattens every text node under the root into one string before
matching, so a phrase split by inline markup is a single match:

```html
<b>an eleme<em>nt bound</em>ary</b>
```

`h.mark('an element boundary')` returns `1`. Under the `css` renderer that is
one `Range` spanning three text nodes; under `mark`, three wrapper elements,
because one element cannot straddle the boundary.

`<script>`, `<style>` and `<noscript>` content is always excluded.

## Controlled ranges

The parity for the core's `ranges` prop. Offsets are into the **flattened**
subtree text, which `.text` exposes so you can compute against exactly what the
matcher saw:

```js
const h = new Highlighter(el);
h.text; // "hello world" — for <p>hello <b>world</b></p>
h.markRanges([{ start: 6, end: 11 }], [{ name: 'cited', index: 0 }]);
```

## Renderers

| | `css` | `mark` |
| --- | --- | --- |
| DOM mutation | none | wraps matches in `<mark>` |
| Cross-element match | one `Range` | one wrapper per text node |
| Styling | `::highlight(name)` | `className` + `data-omh-states` |
| Survives a framework re-render | yes | no — re-`mark()` after |

`strategy: 'auto'` (the default) picks `css` when the browser supports it and
`mark` otherwise. Force one with `{ strategy: 'css' }` or `{ strategy: 'mark' }`,
and read back which one an instance resolved to via `h.renderer`.

## API

```ts
new Highlighter(root: Element | Document | DocumentFragment, opts?: {
  strategy?: 'auto' | 'css' | 'mark';   // default 'auto'
  name?: string;                        // implicit highlight name, default 'match'
  overlapStrategy?: 'merge' | 'nest' | 'first-wins';
  collapseWhitespace?: boolean;         // default true
  filter?: (node: Text) => boolean;
  shadow?: boolean;                     // walk open shadow roots, default false
  markTag?: string;                     // default 'mark'
  markClassName?: string;               // default 'omh-match'
})

h.mark(query, { states?, caseSensitive?, autoEscape?, sanitize? }): number
h.markRanges(ranges, states?): number
h.text: string        // the flattened subtree text
h.renderer: 'css' | 'mark'
h.unmark(): void      // restores the DOM under the `mark` renderer
h.destroy(): void     // alias for unmark
```

Each call to `mark()` replaces that instance's previous marking. Separate
instances are independent — tearing one down leaves the other's highlights
registered.

### Headless

If you only want the segments and will render them yourself:

```js
import { highlight } from 'one-more-highlight/vanilla';

const segments = highlight({
  text: 'time time time',
  searchWords: ['time'],
  states: [{ name: 'active', index: 1 }],
});
```

This is the same pipeline `useHighlight` runs, without React and without
memoization — outside a component there is no render to key a cache against, so
caching is the caller's job.

## Limitation: TypeScript with `skipLibCheck: false`

The emitted declarations carry a bare `import 'react'` inherited from the shared
type chunk. It is inert under `skipLibCheck: true` — TypeScript's own default,
and verified against a project with no React types installed. If you turn
`skipLibCheck` off, add `@types/react` as a dev dependency.
