import type { HighlightRange } from './types.js';
import type { SourceChunk } from './combineChunks.js';

export interface RangeChunks {
  chunks: SourceChunk[];
  /**
   * Distinct `termId`s in first-appearance order. Stands in for `searchWords`
   * when resolving `{ term }` / `{ term, nth }` selectors.
   */
  terms: string[];
}

/**
 * Turns consumer-supplied `ranges` into pipeline chunks. Offsets are clamped
 * to `text`, and empty or inverted ranges are dropped — `buildSegments` walks
 * chunks with a forward-only cursor and would emit garbage segments otherwise.
 */
export function chunksFromRanges(
  ranges: ReadonlyArray<HighlightRange>,
  textLength: number,
): RangeChunks {
  const terms: string[] = [];
  const chunks: SourceChunk[] = [];

  for (const range of ranges) {
    const start = Math.max(0, range.start);
    const end = Math.min(textLength, range.end);
    if (end <= start) continue;

    let termIndex = -1;
    if (range.termId !== undefined) {
      termIndex = terms.indexOf(range.termId);
      if (termIndex === -1) termIndex = terms.push(range.termId) - 1;
    }
    chunks.push({ start, end, termIndex, range });
  }

  return { chunks, terms };
}
