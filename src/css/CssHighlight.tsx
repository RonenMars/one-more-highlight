import { createElement, useRef } from 'react';
import type { ElementRef } from 'react';
import { useHighlight } from '../useHighlight.js';
import { supported } from './supported.js';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect.js';
import type { CssHighlightProps } from './types.js';

export function CssHighlight(props: CssHighlightProps) {
  const {
    text,
    searchWords,
    caseSensitive,
    autoEscape,
    sanitize,
    findChunks,
    states,
    overlapStrategy,
    fallback = 'dom',
    as = 'span',
    className,
    style,
  } = props;

  // Pipeline runs identically to <Highlight>; we use only `segments` here.
  useHighlight({
    text,
    searchWords,
    ...(caseSensitive !== undefined && { caseSensitive }),
    ...(autoEscape !== undefined && { autoEscape }),
    ...(sanitize !== undefined && { sanitize }),
    ...(findChunks !== undefined && { findChunks }),
    ...(states !== undefined && { states }),
    ...(overlapStrategy !== undefined && { overlapStrategy }),
  });

  const containerRef = useRef<ElementRef<'span'>>(null);

  useIsomorphicLayoutEffect(() => {
    if (!supported()) {
      if (fallback === 'throw') {
        throw new Error(
          '[one-more-highlight/css] CSS.highlights is not available in this environment. ' +
            'Set fallback="dom" (default) or fallback="none" to handle this gracefully.',
        );
      }
      // 'dom' fallback is implemented in Task 7. 'none' is a no-op here.
      return;
    }
    // Registry mechanics implemented in Task 5.
    return;
  }, [fallback]);

  return createElement(as, { ref: containerRef, className, style }, text);
}
