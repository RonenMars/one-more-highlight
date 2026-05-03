import type { OverlapStrategy, RawChunk } from './types.js';

export interface CombinedChunk {
  start: number;
  end: number;
  termIndex: number;
  matchIndex: number;
}

function sortChunks(chunks: ReadonlyArray<RawChunk>): RawChunk[] {
  return [...chunks].sort((a, b) => a.start - b.start || a.end - b.end);
}

function combineMerge(sorted: RawChunk[]): CombinedChunk[] {
  const out: CombinedChunk[] = [];
  for (const c of sorted) {
    const prev = out[out.length - 1];
    if (prev && c.start < prev.end) {
      if (c.end > prev.end) prev.end = c.end;
    } else {
      out.push({ start: c.start, end: c.end, termIndex: c.termIndex, matchIndex: out.length });
    }
  }
  return out;
}

function combineFirstWins(sorted: RawChunk[]): CombinedChunk[] {
  const out: CombinedChunk[] = [];
  let lastEnd = -1;
  for (const c of sorted) {
    if (c.start >= lastEnd) {
      out.push({ start: c.start, end: c.end, termIndex: c.termIndex, matchIndex: out.length });
      lastEnd = c.end;
    }
  }
  return out;
}

function combineNest(sorted: RawChunk[]): CombinedChunk[] {
  return sorted.map((c, i) => ({
    start: c.start,
    end: c.end,
    termIndex: c.termIndex,
    matchIndex: i,
  }));
}

export function combineChunks(
  chunks: ReadonlyArray<RawChunk>,
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
