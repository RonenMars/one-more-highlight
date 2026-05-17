import type { CSSProperties, JSX } from 'react';
import type { UseHighlightOptions } from '../types.js';

export type CssHighlightFallback = 'dom' | 'none' | 'throw';

export interface CssHighlightProps extends UseHighlightOptions {
  fallback?: CssHighlightFallback;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}
