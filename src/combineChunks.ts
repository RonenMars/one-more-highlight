import type { HighlightRange, OverlapStrategy, RawChunk } from './types.js';

/** A raw chunk plus the `ranges` entry it came from, when there is one. */
export interface SourceChunk extends RawChunk {
  range?: HighlightRange | undefined;
}

export interface CombinedChunk {
  start: number;
  end: number;
  termIndex: number;
  matchIndex: number;
  range?: HighlightRange | undefined;
}

function sortChunks(chunks: ReadonlyArray<SourceChunk>): SourceChunk[] {
  return [...chunks].sort((a, b) => a.start - b.start || a.end - b.end);
}

function combineMerge(sorted: SourceChunk[]): CombinedChunk[] {
  const out: CombinedChunk[] = [];
  for (const c of sorted) {
    const prev = out[out.length - 1];
    if (prev && c.start < prev.end) {
      if (c.end > prev.end) prev.end = c.end;
    } else {
      // Spread: copies `range` (and anything else a custom findChunks carried)
      // without restating every field. Safe to mutate — it's already a copy.
      out.push({ ...c, matchIndex: out.length });
    }
  }
  return out;
}

function combineFirstWins(sorted: SourceChunk[]): CombinedChunk[] {
  const out: CombinedChunk[] = [];
  let lastEnd = -1;
  for (const c of sorted) {
    if (c.start >= lastEnd) {
      out.push({ ...c, matchIndex: out.length });
      lastEnd = c.end;
    }
  }
  return out;
}

function combineNest(sorted: SourceChunk[]): CombinedChunk[] {
  return sorted.map((c, i) => ({ ...c, matchIndex: i }));
}

export function combineChunks(
  chunks: ReadonlyArray<SourceChunk>,
  strategy: OverlapStrategy,
): CombinedChunk[] {
  const sorted = sortChunks(chunks);
  switch (strategy) {
    case 'merge':
      return combineMerge(sorted);
    case 'first-wins':
      return combineFirstWins(sorted);
    case 'nest':
      return combineNest(sorted);
  }
}
