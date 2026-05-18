import { createElement, useRef } from 'react';
import type { ElementRef } from 'react';
import { Highlight as DomHighlight } from '../Highlight.js';
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

  const { segments } = useHighlight({
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
    if (!supported()) return; // 'none' branch: render plain text, do nothing.

    const textNode = containerRef.current?.firstChild;
    if (!(textNode instanceof Text)) return;

    // Capture the registry at setup so cleanup keeps working even if a
    // test harness restores globals before React's unmount cleanup runs.
    const registry = CSS.highlights;

    const byState = new Map<string, Range[]>();
    for (const seg of segments) {
      if (!seg.isMatch) continue;
      const r = document.createRange();
      r.setStart(textNode, seg.start);
      r.setEnd(textNode, seg.end);
      const names = seg.states.length > 0 ? seg.states : ['match'];
      for (const name of names) {
        const bucket = byState.get(name) ?? [];
        bucket.push(r);
        byState.set(name, bucket);
      }
    }

    const ownedRanges = new Map<string, Range[]>();
    for (const [name, ranges] of byState) {
      let h = registry.get(name);
      if (!h) {
        h = new Highlight(...ranges);
        registry.set(name, h);
      } else {
        for (const r of ranges) h.add(r);
      }
      ownedRanges.set(name, ranges);
    }

    return () => {
      for (const [name, ranges] of ownedRanges) {
        const h = registry.get(name);
        if (!h) continue;
        for (const r of ranges) h.delete(r);
        if (h.size === 0) registry.delete(name);
      }
    };
  }, [segments, fallback]);

  // Synchronous degradation paths. Placed after hook calls so React's
  // Rules of Hooks aren't violated; the effect above no-ops when
  // unsupported, so these branches are safe.
  if (!supported() && fallback === 'dom') {
    const domProps = {
      text,
      searchWords,
      ...(caseSensitive !== undefined && { caseSensitive }),
      ...(autoEscape !== undefined && { autoEscape }),
      ...(sanitize !== undefined && { sanitize }),
      ...(findChunks !== undefined && { findChunks }),
      ...(states !== undefined && { states }),
      ...(overlapStrategy !== undefined && { overlapStrategy }),
      ...(className !== undefined && { className }),
      ...(style !== undefined && { style }),
      as,
    };
    return <DomHighlight {...domProps} />;
  }

  if (!supported() && fallback === 'throw') {
    throw new Error(
      '[one-more-highlight/css] CSS.highlights is not available in this environment. ' +
        'Set fallback="dom" (default) or fallback="none" to handle this gracefully.',
    );
  }

  return createElement(as, { ref: containerRef, className, style }, text);
}
