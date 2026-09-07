import type { WalkOptions } from './types.js';

/** A run of one text node's data, covered by a flat-offset range. */
export interface DomSlice {
  node: Text;
  /** Offset into `node.data`. */
  start: number;
  /** Offset into `node.data`, exclusive. */
  end: number;
}

/**
 * A stretch of flattened text whose mapping back to source offsets is linear:
 * flat offset `f` is `srcStart + (f - flatStart)` in `node.data`. A new piece
 * starts wherever that linearity breaks — i.e. at a node boundary, or where a
 * collapsed whitespace run dropped characters.
 */
interface Piece {
  node: Text;
  flatStart: number;
  srcStart: number;
  length: number;
}

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

export class TextIndex {
  readonly text: string;
  private readonly pieces: ReadonlyArray<Piece>;

  private constructor(text: string, pieces: ReadonlyArray<Piece>) {
    this.text = text;
    this.pieces = pieces;
  }

  /**
   * Flattens every text node under `root` into a single string, recording how
   * to map any offset in it back to a `(node, offset)` pair.
   */
  static from(root: Element | Document | DocumentFragment, opts: WalkOptions = {}): TextIndex {
    const { collapseWhitespace = true, filter, shadow = false } = opts;

    const pieces: Piece[] = [];
    let flat = '';
    // Tracks whether the last character emitted was a collapsed space, so a
    // whitespace run split across node boundaries still yields a single space.
    let pendingSpace = false;

    const push = (node: Text, srcStart: number, srcEnd: number): void => {
      if (srcEnd <= srcStart) return;
      const prev = pieces[pieces.length - 1];
      if (
        prev !== undefined &&
        prev.node === node &&
        prev.srcStart + prev.length === srcStart &&
        prev.flatStart + prev.length === flat.length
      ) {
        prev.length += srcEnd - srcStart;
      } else {
        pieces.push({ node, flatStart: flat.length, srcStart, length: srcEnd - srcStart });
      }
      flat += node.data.slice(srcStart, srcEnd);
      pendingSpace = false;
    };

    const pushCollapsedSpace = (node: Text, srcIndex: number): void => {
      // Leading whitespace maps to nothing, and a run already represented by a
      // space needs no second one.
      if (pendingSpace || flat.length === 0) return;
      const prev = pieces[pieces.length - 1];
      if (
        prev !== undefined &&
        prev.node === node &&
        prev.srcStart + prev.length === srcIndex &&
        prev.flatStart + prev.length === flat.length
      ) {
        prev.length += 1;
      } else {
        pieces.push({ node, flatStart: flat.length, srcStart: srcIndex, length: 1 });
      }
      flat += ' ';
      pendingSpace = true;
    };

    const addText = (node: Text): void => {
      const data = node.data;
      if (data.length === 0) return;
      if (!collapseWhitespace) {
        push(node, 0, data.length);
        return;
      }
      const ws = /\s+/g;
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = ws.exec(data)) !== null) {
        if (m.index > last) push(node, last, m.index);
        pushCollapsedSpace(node, m.index);
        last = ws.lastIndex;
      }
      if (last < data.length) push(node, last, data.length);
    };

    const walk = (start: Node): void => {
      const walker = document.createTreeWalker(
        start,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
          acceptNode(node: Node): number {
            if (node.nodeType === Node.ELEMENT_NODE) {
              return SKIPPED_TAGS.has((node as Element).tagName)
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT;
            }
            if (filter && !filter(node as Text)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        },
      );
      let node = walker.nextNode();
      while (node !== null) {
        if (node.nodeType === Node.TEXT_NODE) {
          addText(node as Text);
        } else if (shadow) {
          const host = (node as Element).shadowRoot;
          if (host !== null) walk(host);
        }
        node = walker.nextNode();
      }
    };

    walk(root);
    return new TextIndex(flat, pieces);
  }

  /** Index of the last piece whose `flatStart` is `<= offset`, or -1. */
  private pieceAt(offset: number): number {
    const pieces = this.pieces;
    let lo = 0;
    let hi = pieces.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      // `pieces` is non-empty in this branch and mid is in range.
      if ((pieces[mid] as Piece).flatStart <= offset) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  }

  /**
   * The per-node slices covering flat range `[start, end)`. Empty when the
   * range is empty or falls outside the indexed text.
   */
  slices(start: number, end: number): DomSlice[] {
    if (end <= start) return [];
    const out: DomSlice[] = [];
    for (let i = Math.max(0, this.pieceAt(start)); i < this.pieces.length; i++) {
      const p = this.pieces[i] as Piece;
      if (p.flatStart >= end) break;
      const from = Math.max(start, p.flatStart);
      const to = Math.min(end, p.flatStart + p.length);
      if (to <= from) continue;
      const sliceStart = p.srcStart + (from - p.flatStart);
      const sliceEnd = p.srcStart + (to - p.flatStart);
      const prev = out[out.length - 1];
      if (prev !== undefined && prev.node === p.node && prev.end === sliceStart) {
        prev.end = sliceEnd;
      } else {
        out.push({ node: p.node, start: sliceStart, end: sliceEnd });
      }
    }
    return out;
  }

  /**
   * A DOM `Range` spanning flat `[start, end)`, or `null` when the range covers
   * no text. Spans element boundaries — `Range` handles that natively, so a
   * match split across inline tags stays one range.
   */
  toRange(start: number, end: number): Range | null {
    const slices = this.slices(start, end);
    const first = slices[0];
    const last = slices[slices.length - 1];
    if (first === undefined || last === undefined) return null;
    const range = document.createRange();
    range.setStart(first.node, first.start);
    range.setEnd(last.node, last.end);
    return range;
  }
}
