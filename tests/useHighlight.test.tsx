import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHighlight } from '../src/useHighlight.js';
import { defaultFindChunks } from '../src/findMatches.js';
import type { HighlightState } from '../src/types.js';

describe('useHighlight', () => {
  it('returns segments for plain text + searchWords', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current.segments).toHaveLength(3);
    expect(result.current.segments[0]?.isMatch).toBe(true);
  });

  it('memoizes across renders with stable inputs', () => {
    const text = 'cat hat cat';
    const searchWords = ['cat'];
    const { result, rerender } = renderHook(() =>
      useHighlight({ text, searchWords }),
    );
    const first = result.current.segments;
    rerender();
    expect(result.current.segments).toBe(first);
  });

  it('recomputes when text changes', () => {
    let text = 'cat';
    const { result, rerender } = renderHook(() =>
      useHighlight({ text, searchWords: ['cat'] }),
    );
    const first = result.current.segments;
    text = 'dog';
    rerender();
    expect(result.current.segments).not.toBe(first);
  });

  it('applies states correctly', () => {
    const { result } = renderHook(() =>
      useHighlight({
        text: 'cat cat cat',
        searchWords: ['cat'],
        states: [{ name: 'active', index: 1 }],
      }),
    );
    const matches = result.current.segments.filter((s) => s.isMatch);
    expect(matches[0]?.isMatch && matches[0].states).toEqual([]);
    expect(matches[1]?.isMatch && matches[1].states).toEqual(['active']);
    expect(matches[2]?.isMatch && matches[2].states).toEqual([]);
  });

  it('getMatchCount returns the number of matching segments', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current.getMatchCount()).toBe(2);
  });

  it('re-computes segments when term / nth / termMatch / silent fields change', () => {
    const initialProps: { states: HighlightState[] } = {
      states: [{ name: 'a', term: 0 }],
    };
    const { result, rerender } = renderHook(
      ({ states }: { states: HighlightState[] }) =>
        useHighlight({
          text: 'cat dog cat',
          searchWords: ['cat', 'dog'],
          states,
        }),
      { initialProps },
    );

    const first = result.current.segments;
    rerender({ states: [{ name: 'a', term: 1 }] });
    expect(result.current.segments).not.toBe(first);

    const second = result.current.segments;
    rerender({ states: [{ name: 'a', term: 1, nth: 0 }] });
    expect(result.current.segments).not.toBe(second);

    const third = result.current.segments;
    rerender({ states: [{ name: 'a', term: 'cat', termMatch: 'first' }] });
    expect(result.current.segments).not.toBe(third);
  });

  it('does not re-run matching when only states change', () => {
    const findChunks = vi.fn(defaultFindChunks);
    const initialProps: { states: HighlightState[] } = {
      states: [{ name: 'active', index: 0 }],
    };
    const { result, rerender } = renderHook(
      ({ states }: { states: HighlightState[] }) =>
        useHighlight({
          text: 'cat hat cat',
          searchWords: ['cat'],
          states,
          findChunks,
        }),
      { initialProps },
    );
    expect(findChunks).toHaveBeenCalledTimes(1);

    rerender({ states: [{ name: 'active', index: 1 }] });
    expect(findChunks).toHaveBeenCalledTimes(1);

    const matches = result.current.segments.filter((s) => s.isMatch);
    expect(matches[0]?.isMatch && matches[0].states).toEqual([]);
    expect(matches[1]?.isMatch && matches[1].states).toEqual(['active']);
  });
  it('re-matches when new searchWords would collide with the old key', () => {
    const { result, rerender } = renderHook(
      ({ searchWords }: { searchWords: string[] }) =>
        useHighlight({ text: 'a b a|s:b', searchWords }),
      { initialProps: { searchWords: ['a|s:b'] } },
    );
    expect(result.current.getMatchCount()).toBe(1);

    rerender({ searchWords: ['a', 'b'] });
    expect(result.current.getMatchCount()).toBe(4);
  });
  it('getMatchByIndex returns the match segment at that index', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current.getMatchByIndex(1)?.text).toBe('cat');
    expect(result.current.getMatchByIndex(1)?.start).toBe(8);
    expect(result.current.getMatchByIndex(5)).toBeUndefined();
  });

  it('getMatchAt returns the match segment covering a character position', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current.getMatchAt(0)?.matchIndex).toBe(0);
    expect(result.current.getMatchAt(9)?.matchIndex).toBe(1);
    expect(result.current.getMatchAt(4)).toBeUndefined();
  });

  it('matchRef registers a node and getMatchNode/scrollToMatch use it', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current.getMatchNode(0)).toBeNull();
    expect(result.current.scrollToMatch(0)).toBe(false);

    const node = document.createElement('mark');
    const scrollIntoView = (node.scrollIntoView = () => {});
    result.current.matchRef(0)(node);

    expect(result.current.getMatchNode(0)).toBe(node);
    expect(result.current.scrollToMatch(0, { block: 'center' })).toBe(true);

    result.current.matchRef(0)(null);
    expect(result.current.getMatchNode(0)).toBeNull();
    void scrollIntoView;
  });

  it('matchRef returns the same callback identity for the same matchIndex', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current.matchRef(0)).toBe(result.current.matchRef(0));
  });
});
