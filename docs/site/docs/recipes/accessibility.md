---
sidebar_position: 4
---

# Accessibility

The default colors used across our **playground and documentation examples are WCAG 2.x AAA contrast-compliant** (≥ 7:1 for normal text). The full table is documented at the top of [`docs/site/src/css/custom.css`](https://github.com/ronenmars/one-more-highlight/blob/main/docs/site/src/css/custom.css) and mirrored in the playground stylesheet — the lowest pair is **9.99 : 1** (text on the pink chip), and most pairs exceed **14 : 1**. Both light and dark themes are covered: chip text is pinned to the same dark foreground in both modes, so highlight ratios stay identical regardless of theme.

The library itself ships **zero CSS** — every color you see in the demos comes from CSS custom properties (`--hl-yellow`, `--hl-green`, etc.) that you override in your own stylesheet. If you stick with the defaults, you inherit the AAA palette. If you swap in your brand colors, the AAA guarantee no longer applies to your build, and you should verify the new combinations.

## Verifying your own palette

Three categories of tooling, from quickest to most thorough:

### 1. Online contrast checker — WebAIM Contrast Checker

The fastest sanity check. Paste your foreground hex and background hex and it returns the contrast ratio along with AA/AAA pass/fail for normal text and large text.

- **Tool:** <https://webaim.org/resources/contrastchecker/>
- **When to use it:** picking colors during design, spot-checking a single pair.
- **Output:** numeric ratio plus four pass/fail labels (AA normal, AA large, AAA normal, AAA large).

Repeat for every highlight color against the text color you plan to render on top of it. For multi-state setups, also check overlap colors if your states layer.

### 2. Automated testing — `axe-core`

Run a full WCAG audit (color contrast plus dozens of other rules) as part of your test suite. Maintained by Deque Systems; the same engine powers Lighthouse's accessibility audits, the axe DevTools browser extension, and `jest-axe`.

```bash
pnpm add -D axe-core @axe-core/react
```

In a React app, the runtime helper logs violations to the console during development:

```ts
import React from 'react';
import ReactDOM from 'react-dom';

if (process.env.NODE_ENV !== 'production') {
  const axe = await import('@axe-core/react');
  axe.default(React, ReactDOM, 1000);
}
```

For unit tests, [`jest-axe`](https://www.npmjs.com/package/jest-axe) and [`axe-playwright`](https://www.npmjs.com/package/axe-playwright) wrap `axe-core` for assertion-style usage:

```ts
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('highlight passes axe', async () => {
  const { container } = render(<Highlight text="..." searchWords={['x']} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- **Tool:** <https://www.npmjs.com/package/axe-core>
- **When to use it:** every PR, on every component that renders user-visible UI.
- **Coverage:** roughly 57% of WCAG issues catchable automatically — contrast, ARIA misuse, missing labels, focus order.

### 3. Site-level accessibility widget — `accessibility` (with a caveat)

Floating-icon "accessibility widgets" inject a sidebar that lets visitors toggle high-contrast mode, larger text, link underlines, and similar adjustments at runtime. The [`accessibility`](https://www.npmjs.com/package/accessibility) package is the most-downloaded option in this space:

```bash
pnpm add accessibility
```

```ts
import { Accessibility } from 'accessibility/dist/main';
new Accessibility();
```

:::caution Overlay widgets are not a replacement for accessible markup

The accessibility community is broadly skeptical of "overlay" widgets. They can help users with specific motor or vision preferences who don't already use OS-level assistive tech, but they **do not fix underlying WCAG violations** — and several popular overlays have themselves failed WCAG audits. Treat them as a small convenience for end users, not a compliance shortcut. The single best thing you can do for accessibility is ship semantic HTML and pass an `axe-core` audit; the widget is optional on top of that.

For background, see Adrian Roselli's [Overlay Fact Sheet](https://overlayfactsheet.com/) — a consolidated, vendor-neutral writeup signed by dozens of accessibility consultants.

:::

- **Tool:** <https://www.npmjs.com/package/accessibility>
- **When to use it:** as a small UX nicety, _after_ your markup already passes `axe-core`.
- **What it does:** injects a floating button that opens a sidebar of user-adjustable preferences (font size, contrast, grayscale, links highlight, etc.).

## Quick checklist for highlight palettes

- [ ] Run every `highlight color × text color` pair through WebAIM (target ≥ 7:1 for AAA normal text, or ≥ 4.5:1 for AA).
- [ ] Verify the same pairs in your dark theme if you use one.
- [ ] If you layer states (e.g. `active` overrides the base color), check the layered combinations too — not just each color in isolation.
- [ ] Add an `axe-core`-based check to CI so future palette tweaks can't silently regress.
- [ ] Confirm the chosen `highlightTag` carries `mark` semantics. The library adds `role="mark"` automatically when `highlightTag` is overridden to a non-semantic element, but a custom render prop that returns a `<div>` bypasses this — restore the role manually if so.
