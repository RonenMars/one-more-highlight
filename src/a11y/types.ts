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
 * Intersection rather than `interface extends`, because `HighlightProps` is a
 * discriminated union over the `searchWords` / `ranges` source. An intersection
 * distributes across both members; extending collapses them and loses every
 * source-specific field.
 */
export type AccessibleHighlightProps = HighlightProps & {
  /** Defaults to `'native'`. */
  mode?: AccessibilityMode;
};
