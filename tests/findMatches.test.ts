import { describe, expect, it } from 'vitest';
import { defaultFindChunks } from '../src/findMatches.js';

describe('defaultFindChunks', () => {
  it('returns empty for empty text', () => {
    expect(defaultFindChunks({ searchWords: ['x'], textToHighlight: '', caseSensitive: false, autoEscape: true })).toEqual([]);
  });

  it('returns empty for empty searchWords', () => {
    expect(defaultFindChunks({ searchWords: [], textToHighlight: 'hi', caseSensitive: false, autoEscape: true })).toEqual([]);
  });

  it('finds simple string matches', () => {
    const r = defaultFindChunks({
      searchWords: ['cat'],
      textToHighlight: 'cat hat cat',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r).toEqual([
      { start: 0, end: 3, termIndex: 0 },
      { start: 8, end: 11, termIndex: 0 },
    ]);
  });

  it('case-insensitive by default', () => {
    const r = defaultFindChunks({
      searchWords: ['cat'],
      textToHighlight: 'Cat CAT cat',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r).toHaveLength(3);
  });

  it('case-sensitive when requested', () => {
    const r = defaultFindChunks({
      searchWords: ['cat'],
      textToHighlight: 'Cat CAT cat',
      caseSensitive: true,
      autoEscape: true,
    });
    expect(r).toEqual([{ start: 8, end: 11, termIndex: 0 }]);
  });

  it('autoEscape escapes regex special chars', () => {
    const r = defaultFindChunks({
      searchWords: ['a.b'],
      textToHighlight: 'a.b axb',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r).toEqual([{ start: 0, end: 3, termIndex: 0 }]);
  });

  it('autoEscape=false treats string as regex source', () => {
    const r = defaultFindChunks({
      searchWords: ['a.b'],
      textToHighlight: 'a.b axb',
      caseSensitive: false,
      autoEscape: false,
    });
    expect(r).toHaveLength(2);
  });

  it('accepts RegExp searchWords', () => {
    const r = defaultFindChunks({
      searchWords: [/\d+/],
      textToHighlight: 'foo 12 bar 345',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r).toEqual([
      { start: 4, end: 6, termIndex: 0 },
      { start: 11, end: 14, termIndex: 0 },
    ]);
  });

  it('does not mutate consumer regex lastIndex', () => {
    const re = /\d+/g;
    re.lastIndex = 99;
    defaultFindChunks({
      searchWords: [re],
      textToHighlight: '1 2 3',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(re.lastIndex).toBe(99);
  });

  it('handles zero-width regex without infinite loop', () => {
    const r = defaultFindChunks({
      searchWords: [/(?:)/g],
      textToHighlight: 'abc',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r).toEqual([]);
  });

  it('skips empty string searchWords', () => {
    const r = defaultFindChunks({
      searchWords: ['', 'cat'],
      textToHighlight: 'cat',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r).toEqual([{ start: 0, end: 3, termIndex: 1 }]);
  });

  it('applies sanitize before matching', () => {
    const r = defaultFindChunks({
      searchWords: ['hello'],
      textToHighlight: 'HELLO world',
      caseSensitive: true,
      autoEscape: true,
      sanitize: (s) => s.toLowerCase(),
    });
    expect(r).toEqual([{ start: 0, end: 5, termIndex: 0 }]);
  });

  it('preserves termIndex per searchWords entry', () => {
    const r = defaultFindChunks({
      searchWords: ['cat', 'dog'],
      textToHighlight: 'cat dog cat',
      caseSensitive: false,
      autoEscape: true,
    });
    expect(r.map((c) => c.termIndex)).toEqual([0, 0, 1]);
  });
});
