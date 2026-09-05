import { describe, expect, it, vi } from 'vitest';
import { applyStates } from '../src/applyStates.js';
import type { CombinedChunk } from '../src/combineChunks.js';
import type { HighlightState, MatchContext } from '../src/types.js';

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
const _predicateShape: HighlightState = { name: 'p', match: (m) => m.start > 0 };
void _termShape;
void _termNthShape;
void _termAllShape;
void _termSilent;
void _predicateShape;

// Offsets below index into TEXT: 'cat' 'dog' 'cat' 'dog'.
const TEXT = 'cat, dog, cat, dog!';

const chunks: CombinedChunk[] = [
  { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
  { start: 5, end: 8, termIndex: 0, matchIndex: 1 },
  { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
  { start: 15, end: 18, termIndex: 0, matchIndex: 3 },
];

describe('applyStates', () => {
  it('returns empty states arrays when no states', () => {
    const r = applyStates(chunks, undefined, [], TEXT);
    expect(r.every((c) => c.states.length === 0)).toBe(true);
  });

  it('tags by single index', () => {
    const states: HighlightState[] = [{ name: 'active', index: 2 }];
    const r = applyStates(chunks, states, [], TEXT);
    expect(r[2]?.states).toEqual(['active']);
    expect(r[0]?.states).toEqual([]);
  });

  it('tags by range (inclusive)', () => {
    const states: HighlightState[] = [{ name: 'preview', range: [1, 2] }];
    const r = applyStates(chunks, states, [], TEXT);
    expect(r[0]?.states).toEqual([]);
    expect(r[1]?.states).toEqual(['preview']);
    expect(r[2]?.states).toEqual(['preview']);
    expect(r[3]?.states).toEqual([]);
  });

  it('tags by indices array', () => {
    const states: HighlightState[] = [{ name: 'bookmarked', indices: [0, 3] }];
    const r = applyStates(chunks, states, [], TEXT);
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
    const r = applyStates(chunks, states, [], TEXT);
    expect(r[1]?.states).toEqual(['active', 'preview', 'bookmarked']);
  });

  it('preserves declaration order in tagged states', () => {
    const states: HighlightState[] = [
      { name: 'b', index: 0 },
      { name: 'a', index: 0 },
    ];
    const r = applyStates(chunks, states, [], TEXT);
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
    const r = applyStates(mixed, states, ['cat', 'dog'], TEXT);
    expect(r[0]?.states).toEqual(['first-term']);
    expect(r[1]?.states).toEqual([]);
    expect(r[2]?.states).toEqual(['first-term']);
    expect(r[3]?.states).toEqual([]);
  });

  it('numeric term out of range — silent no-op with warning suppressed via silent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const states: HighlightState[] = [{ name: 'oops', term: 9, silent: true }];
    const r = applyStates(chunks, states, ['cat'], TEXT);
    expect(r.every((c) => c.states.length === 0)).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('numeric term out of range — warns by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const states: HighlightState[] = [{ name: 'oops', term: 9 }];
    applyStates(chunks, states, ['cat'], TEXT);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/term index 9 .* out of range/i);
    warn.mockRestore();
  });

  it('tags by string term — matches every entry equal to term (default termMatch: all)', () => {
    const mixed: CombinedChunk[] = [
      { start: 0, end: 3, termIndex: 0, matchIndex: 0 },  // 'cat' (first entry)
      { start: 5, end: 8, termIndex: 1, matchIndex: 1 },  // 'dog'
      { start: 10, end: 13, termIndex: 2, matchIndex: 2 }, // 'cat' (third entry)
      { start: 15, end: 18, termIndex: 1, matchIndex: 3 }, // 'dog'
    ];
    const states: HighlightState[] = [{ name: 'cat-state', term: 'cat' }];
    const r = applyStates(mixed, states, ['cat', 'dog', 'cat'], TEXT);
    expect(r[0]?.states).toEqual(['cat-state']);
    expect(r[1]?.states).toEqual([]);
    expect(r[2]?.states).toEqual(['cat-state']);
    expect(r[3]?.states).toEqual([]);
  });

  it('termMatch: "first" binds string term to only the first matching entry', () => {
    const mixed: CombinedChunk[] = [
      { start: 0, end: 3, termIndex: 0, matchIndex: 0 },  // 'cat' (first)
      { start: 10, end: 13, termIndex: 2, matchIndex: 1 }, // 'cat' (third)
    ];
    const states: HighlightState[] = [
      { name: 'first-cat', term: 'cat', termMatch: 'first' },
    ];
    const r = applyStates(mixed, states, ['cat', 'dog', 'cat'], TEXT);
    expect(r[0]?.states).toEqual(['first-cat']);
    expect(r[1]?.states).toEqual([]);
  });

  it('string term does NOT match RegExp entries even when source equals term', () => {
    const mixed: CombinedChunk[] = [
      { start: 0, end: 3, termIndex: 0, matchIndex: 0 }, // 'cat' (string)
      { start: 5, end: 8, termIndex: 1, matchIndex: 1 }, // /cat/ (regex; source === 'cat')
    ];
    const states: HighlightState[] = [{ name: 'literal-cat', term: 'cat' }];
    const r = applyStates(mixed, states, ['cat', /cat/], TEXT);
    expect(r[0]?.states).toEqual(['literal-cat']);
    expect(r[1]?.states).toEqual([]);
  });

  it('unknown string term warns by default and is silent with silent: true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    applyStates(chunks, [{ name: 'missing', term: 'zzz' }], ['cat'], TEXT);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/term "zzz" .* not present/i);
    warn.mockClear();

    applyStates(chunks, [{ name: 'missing', term: 'zzz', silent: true }], ['cat'], TEXT);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('nth selects the Nth occurrence of a term in document order (0-indexed)', () => {
    const mixed: CombinedChunk[] = [
      { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
      { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
      { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
      { start: 15, end: 18, termIndex: 0, matchIndex: 3 },
    ];
    // term 0 has three matches: matchIndices [0, 2, 3] in doc order.
    const r0 = applyStates(mixed, [{ name: 'n0', term: 0, nth: 0 }], ['cat', 'dog'], TEXT);
    expect(r0[0]?.states).toEqual(['n0']);
    expect(r0[2]?.states).toEqual([]);
    expect(r0[3]?.states).toEqual([]);

    const r1 = applyStates(mixed, [{ name: 'n1', term: 0, nth: 1 }], ['cat', 'dog'], TEXT);
    expect(r1[0]?.states).toEqual([]);
    expect(r1[2]?.states).toEqual(['n1']);
    expect(r1[3]?.states).toEqual([]);

    const r2 = applyStates(mixed, [{ name: 'n2', term: 0, nth: 2 }], ['cat', 'dog'], TEXT);
    expect(r2[3]?.states).toEqual(['n2']);
  });

  it('nth out of range — warns by default, silent: true suppresses', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // term 0 has 4 matches; nth: 9 is out of range.
    applyStates(chunks, [{ name: 'over', term: 0, nth: 9 }], ['cat'], TEXT);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/nth: 9 .* only has 4 matches/i);
    warn.mockClear();

    applyStates(
      chunks,
      [{ name: 'over', term: 0, nth: 9, silent: true }],
      ['cat'],
      TEXT,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('nth: -1 is treated as out of range', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const r = applyStates(chunks, [{ name: 'neg', term: 0, nth: -1 }], ['cat'], TEXT);
    expect(r.every((c) => c.states.length === 0)).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('composes term-based and global-index selectors on the same chunk', () => {
    const mixed: CombinedChunk[] = [
      { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
      { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
      { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
    ];
    const states: HighlightState[] = [
      { name: 'first-global', index: 0 },
      { name: 'cat-all', term: 0 },
      { name: 'cat-first', term: 0, nth: 0 },
      { name: 'middle-range', range: [1, 1] },
    ];
    const r = applyStates(mixed, states, ['cat', 'dog'], TEXT);
    expect(r[0]?.states).toEqual(['first-global', 'cat-all', 'cat-first']);
    expect(r[1]?.states).toEqual(['middle-range']);
    expect(r[2]?.states).toEqual(['cat-all']);
  });
});

describe('applyStates — predicate selector', () => {
  const mixed: CombinedChunk[] = [
    { start: 0, end: 3, termIndex: 0, matchIndex: 0 },
    { start: 5, end: 8, termIndex: 1, matchIndex: 1 },
    { start: 10, end: 13, termIndex: 0, matchIndex: 2 },
  ];

  it('tags the matches the predicate accepts', () => {
    const states: HighlightState[] = [
      { name: 'late', match: (m) => m.start >= 5 },
    ];
    const r = applyStates(mixed, states, ['cat', 'dog'], TEXT);
    expect(r.map((c) => c.states)).toEqual([[], ['late'], ['late']]);
  });

  it('receives the full match context under a searchWords source', () => {
    const seen: MatchContext[] = [];
    applyStates(
      mixed,
      [{ name: 'spy', match: (m) => (seen.push(m), false) }],
      ['cat', /dog/],
      TEXT,
    );
    expect(seen).toEqual([
      { index: 0, text: 'cat', start: 0, end: 3, source: TEXT, term: 'cat', termIndex: 0, nthOfTerm: 0 },
      { index: 1, text: 'dog', start: 5, end: 8, source: TEXT, term: /dog/, termIndex: 1, nthOfTerm: 0 },
      { index: 2, text: 'cat', start: 10, end: 13, source: TEXT, term: 'cat', termIndex: 0, nthOfTerm: 1 },
    ]);
  });

  it('counts nthOfTerm per term in document order', () => {
    const states: HighlightState[] = [
      { name: 'second-of-term', match: (m) => m.nthOfTerm === 1 },
    ];
    const r = applyStates(mixed, states, ['cat', 'dog'], TEXT);
    expect(r.map((c) => c.states)).toEqual([[], [], ['second-of-term']]);
  });

  it('exposes the originating range under a ranges source', () => {
    const range = { start: 0, end: 3, id: 'r1', termId: 'cat', metadata: { score: 0.4 } };
    const ranged: CombinedChunk[] = [{ start: 0, end: 3, termIndex: 0, matchIndex: 0, range }];
    const seen: MatchContext[] = [];
    applyStates(
      ranged,
      [{ name: 'spy', match: (m) => (seen.push(m), false) }],
      ['cat'],
      TEXT,
    );
    expect(seen[0]).toEqual({
      index: 0, text: 'cat', start: 0, end: 3, source: TEXT,
      term: 'cat', termIndex: 0, nthOfTerm: 0, range,
    });
    expect(seen[0]?.range).toBe(range);
  });

  it('composes with the other selector forms on the same match', () => {
    const states: HighlightState[] = [
      { name: 'first-global', index: 0 },
      { name: 'short', match: (m) => m.text.length <= 3 },
      { name: 'cat-all', term: 0 },
    ];
    const r = applyStates(mixed, states, ['cat', 'dog'], TEXT);
    expect(r[0]?.states).toEqual(['first-global', 'short', 'cat-all']);
    expect(r[1]?.states).toEqual(['short']);
  });

  it('never warns about out-of-range indices for a predicate', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    applyStates(mixed, [{ name: 'p', match: () => true }], ['cat', 'dog'], TEXT);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
