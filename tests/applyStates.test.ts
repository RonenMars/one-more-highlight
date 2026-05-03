import { describe, expect, it } from 'vitest';
import { applyStates } from '../src/applyStates.js';
import type { CombinedChunk } from '../src/combineChunks.js';
import { match } from '../src/match.js';
import type { HighlightState } from '../src/types.js';

const chunks: CombinedChunk[] = [
  { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
  { start: 5, end: 8, termIndex: 0, matchIndex: 1 },
  { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
  { start: 15, end: 18, termIndex: 0, matchIndex: 3 },
];

describe('applyStates', () => {
  it('returns empty states arrays when no states', () => {
    const r = applyStates(chunks, undefined);
    expect(r.every((c) => c.states.length === 0)).toBe(true);
  });

  it('tags by single index', () => {
    const states: HighlightState[] = [{ name: 'active', ...match.one(2) }];
    const r = applyStates(chunks, states);
    expect(r[2]?.states).toEqual(['active']);
    expect(r[0]?.states).toEqual([]);
  });

  it('tags by range (inclusive)', () => {
    const states: HighlightState[] = [{ name: 'preview', ...match.range(1, 2) }];
    const r = applyStates(chunks, states);
    expect(r[0]?.states).toEqual([]);
    expect(r[1]?.states).toEqual(['preview']);
    expect(r[2]?.states).toEqual(['preview']);
    expect(r[3]?.states).toEqual([]);
  });

  it('tags by indices array', () => {
    const states: HighlightState[] = [{ name: 'bookmarked', ...match.many([0, 3]) }];
    const r = applyStates(chunks, states);
    expect(r[0]?.states).toEqual(['bookmarked']);
    expect(r[3]?.states).toEqual(['bookmarked']);
    expect(r[1]?.states).toEqual([]);
  });

  it('composes multiple states on the same match', () => {
    const states: HighlightState[] = [
      { name: 'active', ...match.one(1) },
      { name: 'preview', ...match.range(0, 2) },
      { name: 'bookmarked', ...match.many([1]) },
    ];
    const r = applyStates(chunks, states);
    expect(r[1]?.states).toEqual(['active', 'preview', 'bookmarked']);
  });

  it('preserves declaration order in tagged states', () => {
    const states: HighlightState[] = [
      { name: 'b', ...match.one(0) },
      { name: 'a', ...match.one(0) },
    ];
    const r = applyStates(chunks, states);
    expect(r[0]?.states).toEqual(['b', 'a']);
  });
});
