import { IMPLICIT_HIGHLIGHT_NAME } from '../../css/types.js';
import type { Segment } from '../../types.js';
import type { TextIndex } from '../walk.js';

/**
 * Paints `segments` with the CSS Custom Highlight API. Returns the teardown.
 *
 * Lifted from the `/css` engine's effect body — the difference is that a
 * `TextIndex` supplies the `Range`s, so a match spanning inline elements stays
 * one range instead of requiring a single flat text node.
 */
export function paintCss(
  index: TextIndex,
  segments: ReadonlyArray<Segment>,
  opts: { name: string; highlightType?: 'highlight' | 'spelling-error' | 'grammar-error' },
): () => void {
  // Captured at setup so teardown keeps working even if a test harness
  // restores globals first.
  const registry = CSS.highlights;

  const byState = new Map<string, Range[]>();
  for (const seg of segments) {
    if (!seg.isMatch) continue;
    const range = index.toRange(seg.start, seg.end);
    if (range === null) continue;
    const names = seg.states.length > 0 ? seg.states : [opts.name || IMPLICIT_HIGHLIGHT_NAME];
    for (const name of names) {
      const bucket = byState.get(name) ?? [];
      bucket.push(range);
      byState.set(name, bucket);
    }
  }

  const ownedRanges = new Map<string, Range[]>();
  for (const [name, ranges] of byState) {
    let h = registry.get(name);
    if (!h) {
      h = new Highlight(...ranges);
      if (opts.highlightType !== undefined) h.type = opts.highlightType;
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
}
