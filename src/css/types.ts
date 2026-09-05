import type { CSSProperties, JSX } from 'react';
import type { UseHighlightOptions } from '../types.js';

/**
 * Implicit state name for matches with `states.length === 0`.
 * Author CSS targets it via `::highlight(match) { … }`.
 */
export const IMPLICIT_HIGHLIGHT_NAME = 'match';

/**
 * Behavior in browsers without CSS Custom Highlight API support.
 *
 * - `'dom'` — Render via the DOM `<Highlight>` engine (with `<mark>`
 *   spans). Visually equivalent to the default component. Default.
 * - `'none'` — Render the plain text wrapper with no highlights.
 * - `'throw'` — Throw synchronously during render with a clear message.
 *   Opt-in for strict consumers who want to fail loudly.
 */
export type CssHighlightFallback = 'dom' | 'none' | 'throw';

/**
 * Props for the CSS Custom Highlight API engine.
 *
 * `className` and `style` apply to the wrapper element. Per-match
 * styling is via `::highlight(name)` in your CSS — the library does
 * not synthesize styles or accept `className`/`style` on individual
 * `HighlightState` entries.
 */
/** Mirrors the `HighlightType` enum from the CSS Custom Highlight API. */
export type HighlightRangeType = 'highlight' | 'spelling-error' | 'grammar-error';

export type CssHighlightProps = UseHighlightOptions & {
  /** Behavior in unsupported browsers. Defaults to `'dom'`. */
  fallback?: CssHighlightFallback;
  /**
   * Sets `Highlight.type`, which is how a painted range reaches the
   * accessibility tree — it is the only accessibility affordance this engine
   * has, since it creates no DOM per match. Defaults to `'highlight'`.
   *
   * Screen-reader support is real but uneven; see the support matrix in
   * `docs/site/docs/engines/css-highlights.md` before relying on it.
   */
  highlightType?: HighlightRangeType;
  /** Wrapper element tag. Defaults to `'span'`. */
  as?: keyof JSX.IntrinsicElements;
  /** Forwarded to the wrapper element, not to individual matches. */
  className?: string;
  /** Forwarded to the wrapper element, not to individual matches. */
  style?: CSSProperties;
};
