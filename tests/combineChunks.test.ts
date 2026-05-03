import { describe, expect, it } from 'vitest';
import { combineChunks } from '../src/combineChunks.js';
import type { RawChunk } from '../src/types.js';

const chunk = (start: number, end: number, termIndex = 0): RawChunk => ({ start, end, termIndex });

describe('combineChunks', () => {
  describe('merge strategy', () => {
    it('keeps non-overlapping chunks separate', () => {
      const r = combineChunks([chunk(0, 3), chunk(5, 8)], 'merge');
      expect(r).toHaveLength(2);
      expect(r[0]).toMatchObject({ start: 0, end: 3, matchIndex: 0 });
      expect(r[1]).toMatchObject({ start: 5, end: 8, matchIndex: 1 });
    });

    it('merges overlapping chunks taking max end', () => {
      const r = combineChunks([chunk(0, 5), chunk(3, 8)], 'merge');
      expect(r).toHaveLength(1);
      expect(r[0]).toMatchObject({ start: 0, end: 8, matchIndex: 0 });
    });

    it('merges fully-contained chunks', () => {
      const r = combineChunks([chunk(0, 10), chunk(2, 5)], 'merge');
      expect(r).toHaveLength(1);
      expect(r[0]).toMatchObject({ start: 0, end: 10 });
    });

    it('sorts unsorted input', () => {
      const r = combineChunks([chunk(5, 8), chunk(0, 3)], 'merge');
      expect(r[0]?.start).toBe(0);
      expect(r[1]?.start).toBe(5);
    });

    it('assigns matchIndex in document order', () => {
      const r = combineChunks([chunk(10, 12), chunk(0, 3), chunk(5, 7)], 'merge');
      expect(r.map((c) => c.matchIndex)).toEqual([0, 1, 2]);
    });
  });

  describe('first-wins strategy', () => {
    it('drops later overlapping chunks entirely', () => {
      const r = combineChunks([chunk(0, 5), chunk(3, 8)], 'first-wins');
      expect(r).toHaveLength(1);
      expect(r[0]).toMatchObject({ start: 0, end: 5 });
    });

    it('keeps adjacent non-overlapping chunks', () => {
      const r = combineChunks([chunk(0, 3), chunk(3, 6)], 'first-wins');
      expect(r).toHaveLength(2);
    });
  });

  describe('nest strategy', () => {
    it('preserves all chunks individually', () => {
      const r = combineChunks([chunk(0, 5), chunk(3, 8)], 'nest');
      expect(r).toHaveLength(2);
      expect(r.map((c) => c.matchIndex)).toEqual([0, 1]);
    });
  });

  it('handles empty input', () => {
    expect(combineChunks([], 'merge')).toEqual([]);
    expect(combineChunks([], 'nest')).toEqual([]);
    expect(combineChunks([], 'first-wins')).toEqual([]);
  });
});
