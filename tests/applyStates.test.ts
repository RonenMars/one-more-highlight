import { describe, expect, it, vi } from 'vitest';
import { applyStates } from '../src/applyStates.js';
import type { CombinedChunk } from '../src/combineChunks.js';
import type { HighlightState } from '../src/types.js';

// Type-level smoke test: the new shapes must be assignable to HighlightState.
// If this file no longer compiles, the union is missing the new members.
const _termShape: HighlightState = { name: 't', term: 'cat' };
const _termNthShape: HighlightState = { name: 'tn', term: 0, nth: 2 };
const _termAllShape: HighlightState = {
  name: 'ta',
  term: 'cat',
  termMatch: 'all',
};
const _termSilent: HighlightState = { name: 'ts', term: 'cat', silent: true };
void _termShape;
void _termNthShape;
void _termAllShape;
void _termSilent;

const chunks: CombinedChunk[] = [
  { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
  { start: 5, end: 8, termIndex: 0, matchIndex: 1 },
  { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
  { start: 15, end: 18, termIndex: 0, matchIndex: 3 },
];

describe('applyStates', () => {
  it('returns empty states arrays when no states', () => {
    const r = applyStates(chunks, undefined, []);
    expect(r.every((c) => c.states.length === 0)).toBe(true);
  });

  it('tags by single index', () => {
    const states: HighlightState[] = [{ name: 'active', index: 2 }];
    const r = applyStates(chunks, states, []);
    expect(r[2]?.states).toEqual(['active']);
    expect(r[0]?.states).toEqual([]);
  });

  it('tags by range (inclusive)', () => {
    const states: HighlightState[] = [{ name: 'preview', range: [1, 2] }];
    const r = applyStates(chunks, states, []);
    expect(r[0]?.states).toEqual([]);
    expect(r[1]?.states).toEqual(['preview']);
    expect(r[2]?.states).toEqual(['preview']);
    expect(r[3]?.states).toEqual([]);
  });

  it('tags by indices array', () => {
    const states: HighlightState[] = [{ name: 'bookmarked', indices: [0, 3] }];
    const r = applyStates(chunks, states, []);
    expect(r[0]?.states).toEqual(['bookmarked']);
    expect(r[3]?.states).toEqual(['bookmarked']);
    expect(r[1]?.states).toEqual([]);
  });

  it('composes multiple states on the same match', () => {
    const states: HighlightState[] = [
      { name: 'active', index: 1 },
      { name: 'preview', range: [0, 2] },
      { name: 'bookmarked', indices: [1] },
    ];
    const r = applyStates(chunks, states, []);
    expect(r[1]?.states).toEqual(['active', 'preview', 'bookmarked']);
  });

  it('preserves declaration order in tagged states', () => {
    const states: HighlightState[] = [
      { name: 'b', index: 0 },
      { name: 'a', index: 0 },
    ];
    const r = applyStates(chunks, states, []);
    expect(r[0]?.states).toEqual(['b', 'a']);
  });

  it('tags by numeric term — selects matches whose termIndex equals state.term', () => {
    // chunks 0/2 are termIndex 0; chunks 1/3 are termIndex 1.
    const mixed: CombinedChunk[] = [
      { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
      { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
      { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
      { start: 15, end: 18, termIndex: 1, matchIndex: 3 },
    ];
    const states: HighlightState[] = [{ name: 'first-term', term: 0 }];
    const r = applyStates(mixed, states, ['cat', 'dog']);
    expect(r[0]?.states).toEqual(['first-term']);
    expect(r[1]?.states).toEqual([]);
    expect(r[2]?.states).toEqual(['first-term']);
    expect(r[3]?.states).toEqual([]);
  });

  it('numeric term out of range — silent no-op with warning suppressed via silent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const states: HighlightState[] = [{ name: 'oops', term: 9, silent: true }];
    const r = applyStates(chunks, states, ['cat']);
    expect(r.every((c) => c.states.length === 0)).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('numeric term out of range — warns by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const states: HighlightState[] = [{ name: 'oops', term: 9 }];
    applyStates(chunks, states, ['cat']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/term index 9 .* out of range/i);
    warn.mockRestore();
  });
});
