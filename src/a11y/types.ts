import type { CssHighlightFallback } from '../css/types.js';
import type { HighlightProps } from '../types.js';

/**
 * Semantic-bridge rendering mode. DOM `<mark>` and CSS Custom Highlights give
 * assistive technology different (unequal) results; these modes make that
 * choice explicit rather than accidental.
 *
 * - `'native'` — today's `<Highlight>` behaviour, unchanged.
 * - `'dual'` — a fragmented visual layer (`aria-hidden`) plus a
 *   visually-hidden, unbroken copy of the full text for AT to read.
 * - `'annotated'` — the visual layer stays in the accessibility tree, with
 *   visually-hidden "highlight start" / "highlight end" boundary markers
 *   around each match.
 */
export type AccessibilityMode = 'native' | 'dual' | 'annotated';

/**
 * Which engine paints the visual layer. The accessible layer is built from
 * `mode` alone, so a given `mode` exposes the same accessible output to
 * assistive technology under either engine.
 *
 * - `'dom'` — `<Highlight>`: one `<mark>` per match. Default.
 * - `'css'` — `<CssHighlight>`: CSS Custom Highlight ranges. Painted ranges
 *   have no DOM to carry semantics, so the accessible layer is rendered
 *   separately, visually hidden, beside an `aria-hidden` visual layer.
 *   Only `mode="dual"` keeps the engine's zero-DOM-nodes-per-match property;
 *   `'native'` and `'annotated'` pay a hidden `<mark>` tree for parity.
 */
export type HighlightEngine = 'dom' | 'css';

/**
 * Intersection rather than `interface extends`, because `HighlightProps` is a
 * discriminated union over the `searchWords` / `ranges` source. An intersection
 * distributes across both members; extending collapses them and loses every
 * source-specific field.
 */
export type AccessibleHighlightProps = HighlightProps & {
  /** Defaults to `'native'`. */
  mode?: AccessibilityMode;
  /** Defaults to `'dom'`. */
  engine?: HighlightEngine;
  /** Unsupported-browser behaviour of the CSS engine. `engine="css"` only. */
  fallback?: CssHighlightFallback;
};
