import type { Segment } from '../../types.js';
import type { TextIndex } from '../walk.js';
import type { DomSlice } from '../walk.js';

export interface MarkRenderOptions {
  /** Tag to inject. Defaults to `'mark'`. */
  tag: string;
  /** Class applied to every injected element. */
  className: string;
  /** State name → the `className` declared on that state. */
  stateClasses: ReadonlyMap<string, string>;
}

/**
 * Paints `segments` by injecting elements around each match. Returns the
 * teardown, which restores the original DOM shape.
 *
 * The fallback for browsers without the CSS Custom Highlight API. A match
 * spanning inline elements becomes one wrapper *per text node* — a single
 * element can't straddle the boundary — which is why the CSS renderer is
 * preferred wherever it exists.
 */
export function paintMark(
  index: TextIndex,
  segments: ReadonlyArray<Segment>,
  opts: MarkRenderOptions,
): () => void {
  // Per node, in ascending offset order, so the reverse pass below is safe.
  const perNode = new Map<Text, Array<{ slice: DomSlice; states: ReadonlyArray<string> }>>();
  for (const seg of segments) {
    if (!seg.isMatch) continue;
    for (const slice of index.slices(seg.start, seg.end)) {
      const bucket = perNode.get(slice.node) ?? [];
      bucket.push({ slice, states: seg.states });
      perNode.set(slice.node, bucket);
    }
  }

  const wrappers: Element[] = [];
  const parents = new Set<Node>();

  for (const [node, entries] of perNode) {
    // Splitting from the end keeps every earlier offset in this node valid.
    for (let i = entries.length - 1; i >= 0; i--) {
      const { slice, states } = entries[i] as { slice: DomSlice; states: ReadonlyArray<string> };
      const parent = node.parentNode;
      if (parent === null) continue;
      if (slice.end < node.data.length) node.splitText(slice.end);
      const target = slice.start > 0 ? node.splitText(slice.start) : node;

      const el = document.createElement(opts.tag);
      const classes = [opts.className];
      for (const name of states) {
        const cls = opts.stateClasses.get(name);
        if (cls) classes.push(cls);
      }
      el.className = classes.filter(Boolean).join(' ');
      if (states.length > 0) el.setAttribute('data-omh-states', states.join(' '));

      target.parentNode?.replaceChild(el, target);
      el.appendChild(target);
      wrappers.push(el);
      parents.add(parent);
    }
  }

  return () => {
    for (const el of wrappers) {
      const parent = el.parentNode;
      if (parent === null) continue;
      while (el.firstChild !== null) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
    // Re-merges the text nodes the splits created, restoring the original shape.
    for (const parent of parents) (parent as Element).normalize();
  };
}
