import { describe, expect, it } from 'vitest';
import { buildSegments } from '../src/buildSegments.js';
import type { TaggedChunk } from '../src/applyStates.js';

const tagged = (start: number, end: number, matchIndex: number, states: string[] = []): TaggedChunk => ({
  start,
  end,
  termIndex: 0,
  matchIndex,
  states,
});

describe('buildSegments', () => {
  it('returns empty for empty text and no chunks', () => {
    expect(buildSegments('', [])).toEqual([]);
  });

  it('returns single text segment when no matches', () => {
    expect(buildSegments('hello', [])).toEqual([
      { text: 'hello', isMatch: false, start: 0, end: 5 },
    ]);
  });

  it('emits text-match-text alternation', () => {
    const r = buildSegments('hi cat go', [tagged(3, 6, 0)]);
    expect(r).toEqual([
      { text: 'hi ', isMatch: false, start: 0, end: 3 },
      { text: 'cat', isMatch: true, matchIndex: 0, start: 3, end: 6, states: [] },
      { text: ' go', isMatch: false, start: 6, end: 9 },
    ]);
  });

  it('handles match at start of text', () => {
    const r = buildSegments('cat go', [tagged(0, 3, 0)]);
    expect(r[0]?.isMatch).toBe(true);
  });

  it('handles match at end of text', () => {
    const r = buildSegments('hi cat', [tagged(3, 6, 0)]);
    expect(r[r.length - 1]?.isMatch).toBe(true);
  });

  it('handles adjacent matches', () => {
    const r = buildSegments('catdog', [tagged(0, 3, 0), tagged(3, 6, 1)]);
    expect(r).toHaveLength(2);
    expect(r.every((s) => s.isMatch)).toBe(true);
  });

  it('joined segments equal original text', () => {
    const text = 'foo bar baz qux foo';
    const chunks: TaggedChunk[] = [tagged(0, 3, 0), tagged(8, 11, 1), tagged(16, 19, 2)];
    const segs = buildSegments(text, chunks);
    expect(segs.map((s) => s.text).join('')).toBe(text);
  });

  it('preserves states on match segments', () => {
    const r = buildSegments('cat', [tagged(0, 3, 0, ['active', 'bookmarked'])]);
    expect(r[0]).toMatchObject({ isMatch: true, states: ['active', 'bookmarked'] });
  });
});
