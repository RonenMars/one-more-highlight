import { describe, expect, it } from 'vitest';
import { chunksFromRanges } from '../src/fromRanges.js';

describe('chunksFromRanges', () => {
  it('passes ranges through as chunks, carrying the source range', () => {
    const range = { start: 4, end: 7, id: 'r1', metadata: { score: 0.9 } };
    const { chunks } = chunksFromRanges([range], 20);
    expect(chunks).toEqual([{ start: 4, end: 7, termIndex: -1, range }]);
    expect(chunks[0]?.range).toBe(range);
  });

  it('numbers distinct termIds in first-appearance order', () => {
    const { chunks, terms } = chunksFromRanges(
      [
        { start: 0, end: 3, termId: 'cat' },
        { start: 4, end: 7, termId: 'dog' },
        { start: 8, end: 11, termId: 'cat' },
      ],
      20,
    );
    expect(terms).toEqual(['cat', 'dog']);
    expect(chunks.map((c) => c.termIndex)).toEqual([0, 1, 0]);
  });

  it('gives ranges without a termId termIndex -1', () => {
    const { chunks, terms } = chunksFromRanges(
      [{ start: 0, end: 3 }, { start: 4, end: 7, termId: 'cat' }],
      20,
    );
    expect(terms).toEqual(['cat']);
    expect(chunks.map((c) => c.termIndex)).toEqual([-1, 0]);
  });

  it('clamps to the text bounds', () => {
    const { chunks } = chunksFromRanges([{ start: -5, end: 99 }], 10);
    expect(chunks).toEqual([
      { start: 0, end: 10, termIndex: -1, range: { start: -5, end: 99 } },
    ]);
  });

  it('drops empty, inverted and fully out-of-bounds ranges', () => {
    const { chunks } = chunksFromRanges(
      [
        { start: 3, end: 3 },
        { start: 6, end: 2 },
        { start: 50, end: 60 },
        { start: -9, end: -1 },
        { start: 1, end: 2 },
      ],
      10,
    );
    expect(chunks).toEqual([
      { start: 1, end: 2, termIndex: -1, range: { start: 1, end: 2 } },
    ]);
  });
});
