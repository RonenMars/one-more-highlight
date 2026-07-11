import { charToLine, computeMatchLayouts } from '../../src/native/matchLayout';
import type { TextLayoutLine } from 'react-native';
import type { Segment } from '../../src/types';

/** Build a minimal TextLayoutLine — only `text`, `y`, `height` matter here. */
function line(text: string, y: number, height = 10): TextLayoutLine {
  return {
    text,
    y,
    height,
    x: 0,
    width: text.length,
    ascender: 0,
    descender: 0,
    capHeight: 0,
    xHeight: 0,
  };
}

describe('charToLine', () => {
  const lines = [line('hello ', 0), line('brown ', 10), line('fox', 20)];

  it('maps an offset on the first line', () => {
    expect(charToLine(lines, 0)).toBe(0);
    expect(charToLine(lines, 5)).toBe(0);
  });

  it('maps an offset on a middle line', () => {
    expect(charToLine(lines, 6)).toBe(1); // first char of "brown"
    expect(charToLine(lines, 11)).toBe(1);
  });

  it('maps an offset on the last line', () => {
    expect(charToLine(lines, 12)).toBe(2); // first char of "fox"
    expect(charToLine(lines, 14)).toBe(2);
  });

  it('assigns a line-boundary offset to the next line', () => {
    // offset 6 == accumulated length of line 0 → belongs to line 1's start.
    expect(charToLine(lines, 6)).toBe(1);
  });

  it('falls back to the last line when trailing whitespace was dropped', () => {
    // Platform dropped the trailing space: reported lengths total 5+5+3=13,
    // but a real offset can reach 14 (the wrapped space). Must not vanish.
    const trimmed = [line('hello', 0), line('brown', 10), line('fox', 20)];
    expect(charToLine(trimmed, 14)).toBe(2);
  });

  it('falls back to the last line on offset overrun', () => {
    expect(charToLine(lines, 999)).toBe(2);
  });

  it('returns -1 for an empty lines array', () => {
    expect(charToLine([], 0)).toBe(-1);
  });
});

describe('computeMatchLayouts', () => {
  const segs: Segment[] = [
    { text: 'hello ', isMatch: false, start: 0, end: 6 },
    { text: 'brown', isMatch: true, matchIndex: 0, termIndex: 0, start: 6, end: 11, states: [] },
    { text: ' ', isMatch: false, start: 11, end: 12 },
    { text: 'fox', isMatch: true, matchIndex: 1, termIndex: 1, start: 12, end: 15, states: [] },
  ];
  const lines = [line('hello ', 0), line('brown ', 10), line('fox', 20)];

  it('reports each match with its first line box', () => {
    const out = computeMatchLayouts(segs, lines);
    expect(out).toEqual([
      { matchIndex: 0, termIndex: 0, start: 6, end: 11, lineIndex: 1, y: 10, height: 10 },
      { matchIndex: 1, termIndex: 1, start: 12, end: 15, lineIndex: 2, y: 20, height: 10 },
    ]);
  });

  it('reports the first line for a match wrapping across lines', () => {
    // A single match spanning offsets 6..16 starts on line 1.
    const wrapping: Segment[] = [
      { text: 'hello ', isMatch: false, start: 0, end: 6 },
      { text: 'brown fox', isMatch: true, matchIndex: 0, termIndex: 0, start: 6, end: 15, states: [] },
    ];
    const out = computeMatchLayouts(wrapping, lines);
    expect(out[0]!.lineIndex).toBe(1);
    expect(out[0]!.y).toBe(10);
  });

  it('returns [] when there are no lines', () => {
    expect(computeMatchLayouts(segs, [])).toEqual([]);
  });
});
