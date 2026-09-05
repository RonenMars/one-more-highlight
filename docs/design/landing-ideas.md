# Landing page — ideas

Context: there are currently three landing-page variants in the repo root:

- `landing/` — long-form editorial design with marker-stroke headline highlights.
- `landing-2/` — a faithful 1:1 reproduction of the Stitch reference in `stitch_one_more_highlight_landing_page/`. Uses fabricated nav/footer links and an invented `<Highlight>` API for design fidelity only; not shippable as-is.
- `landing-3/` — same structural skeleton as `landing-2/` (centered hero, mono-everywhere, 4-up icon row, install pill, simple footer), but with the real library's API, copy, and link targets. Shippable.

`landing-3/` deliberately stays visually close to `landing-2/` — the brief was "stitch structure + real content", not "redesign". The ideas below are ways to make `landing-3/` feel *visually* distinct from `landing-2/` while keeping the Stitch-derived bones. Pick zero, one, or several.

Each idea is sized as a small task, slotting between existing `landing-3/` sections.

---

## Idea 1 — Rendered multi-state preview above the hero code

Add a paper-on-dark "rendered output" block directly above the `Highlight.tsx` code block in the hero. Shows the five `time` matches with their layered states — base yellow, base+recent green, base+active pink-with-ring, base, base+bookmarked underline — plus a small legend mapping each match index to its state.

**Why it helps:** today the hero is "code only" and the reader has to mentally execute it. The rendered preview makes the multi-state demo land in 1 second instead of 10. Sets `landing-3/` apart from `landing-2/` (which shows neither input nor output as a real demo).

**Where it lives:** between the hero `<h1>`/subparagraph and the `Highlight.tsx` code block. Keeps the centered hero composition.

**Cost:** ~40 lines of markup, ~30 lines of CSS (most of it already exists in `landing/styles.css` — search for `.demo-preview` and `.preview-row`).

**Watch out for:** layered `<mark>` composition is finicky to style cleanly. Steal the working `mark.hl.base.recent mark.inner` rules from `landing/styles.css`. AAA contrast on every text/background pair (`#06070a` text on `#FFF166`/`#A8FF80`/`#FFADD6`).

---

## Idea 2 — "Two ways to use it" — component vs hook

A side-by-side two-column section between the 4-up feature row and the Install pill. Left column: `<Highlight>` component with a 10-line snippet. Right column: `useHighlight` hook with a 10-line snippet that maps `segments` into custom `<mark>` / `<span>` nodes.

**Why it helps:** the "Headless" claim in the feature row tells you the hook exists; this section shows you what it looks like. It's the most concrete answer to "what does the headless escape hatch buy me?" — and answering that is the single thing that separates `one-more-highlight` from `react-highlight-words`.

**Where it lives:** new `<section>` between `Feature Rows` and `Install Section` in `landing-3/index.html`.

**Cost:** ~80 lines (heading + 2 code blocks + 2 paragraphs).

**Watch out for:** the column stack on mobile. Both code blocks need `overflow-x: auto` and `font-size: 13px` minimum so they don't reflow line breaks. At 960px breakpoint, columns collapse to single-column with the component shown first.

---

## Idea 3 — Specs strip

A single horizontal row of `term — value` pairs in mono, separated by vertical hairlines. Same shape as the one in `landing/`:

```
Bundle ~2 KB br · Engine /css ~2.4 KB br · Peer react ≥ 18 · Runtime deps 2 · Modules ESM + CJS · Browsers Chrome 112+, Firefox 140+, Safari 16.4+ · Node 18+ · TypeScript 5.0+ · License MIT
```

**Why it helps:** this is the section technical-developer audiences read first. Bundle size + peer range + browser support are the four facts that decide whether they keep reading. Today `landing-3/` buries this info inside the "Tiny" feature paragraph.

**Where it lives:** between the 4-up feature row and the Install pill (above Idea 2 if you do both).

**Cost:** ~30 lines of markup + ~20 lines of CSS. Copy the `.specs-strip` rules from `landing/styles.css`.

**Watch out for:** on mobile it has to wrap into multiple rows without collapsing into a vertical list — keep `display: flex; flex-wrap: wrap` and let the vertical rules drop where rows break.

---

## Idea 4 — "How it composes" — three selector forms

Three small code chips in a row, each showing one selector shape:

- **single**: `{ name: 'active', index: 2, className: 'is-active' }`
- **range**: `{ name: 'preview', range: [0, 1], className: 'is-preview' }`
- **list**: `{ name: 'bookmarked', indices: [0, 4, 7], className: 'is-bookmarked' }`

Plus one short sentence above explaining that `HighlightState` is a discriminated union that narrows on the selector field.

**Why it helps:** this is the *headline feature* of the library per `CLAUDE.md` ("first-class multi-state per-match styling"). Showing the union concretely — three shapes side by side, each isolated — beats explaining it in prose. It's also the one thing the library does that no competitor does.

**Where it lives:** new section between the hero code and the 4-up feature row, framing the rest of the page as "here's the headline thing, now here are the four reasons it's also tiny / typed / headless / SSR-safe".

**Cost:** ~60 lines (heading + paragraph + 3 code chips in a grid + closing sentence on composition).

**Watch out for:** the three chips need to feel like *small* code samples, not big code blocks. Constrain to ~3 lines each, `font-size: 13px`, `padding: 16px`. Each chip gets its own corner label (`single`, `range`, `list`) in the same chip style as the hero code's `Highlight.tsx`.

---

## Picking one

If you do exactly one: **Idea 1** (rendered preview). Highest visual differentiation per line of code; directly demonstrates the headline feature.

If you do two: add **Idea 4** (selector forms). Makes the page actually explain what "multi-state" means rather than asserting it.

If you do all four: insert in this order — Idea 1 (inside hero), Idea 4 (after hero), Idea 3 (specs strip), Idea 2 (two ways to use it), then Install + Footer. The page grows from ~1.5 screens to ~3 screens but stays under the length of `landing/`.

## Hard nos for any of these

- No new runtime dependencies. The landing page is a static HTML file; keep it that way. (Tailwind via CDN is fine because it's a static asset and pinned to a CDN URL — but don't add a real build step.)
- No fabricated content. Every code snippet must work against the published `one-more-highlight` v1.1.0 API. If something doesn't fit, change the layout, not the truth.
- No glassmorphism, no gradient text, no side-stripe borders, no testimonials, no Discord CTA. Same constraints as the original brief in `docs/landing-page-prompt.md`.
