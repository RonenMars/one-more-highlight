import type { CSSProperties, JSX } from 'react';
import type { UseHighlightOptions } from '../types.js';

// Implicit state name for matches with `states.length === 0`.
// Author CSS targets it via `::highlight(match) { … }`.
export const IMPLICIT_HIGHLIGHT_NAME = 'match';

export type CssHighlightFallback = 'dom' | 'none' | 'throw';

export interface CssHighlightProps extends UseHighlightOptions {
  fallback?: CssHighlightFallback;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}
