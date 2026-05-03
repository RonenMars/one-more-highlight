import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHighlight } from '../src/useHighlight.js';
import { match } from '../src/match.js';

describe('useHighlight', () => {
  it('returns segments for plain text + searchWords', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat hat cat', searchWords: ['cat'] }),
    );
    expect(result.current).toHaveLength(3);
    expect(result.current[0]?.isMatch).toBe(true);
  });

  it('memoizes across renders with stable inputs', () => {
    const text = 'cat hat cat';
    const searchWords = ['cat'];
    const { result, rerender } = renderHook(() =>
      useHighlight({ text, searchWords }),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('recomputes when text changes', () => {
    let text = 'cat';
    const { result, rerender } = renderHook(() =>
      useHighlight({ text, searchWords: ['cat'] }),
    );
    const first = result.current;
    text = 'dog';
    rerender();
    expect(result.current).not.toBe(first);
  });

  it('applies states correctly', () => {
    const { result } = renderHook(() =>
      useHighlight({
        text: 'cat cat cat',
        searchWords: ['cat'],
        states: [{ name: 'active', ...match.one(1) }],
      }),
    );
    const matches = result.current.filter((s) => s.isMatch);
    expect(matches[0]?.isMatch && matches[0].states).toEqual([]);
    expect(matches[1]?.isMatch && matches[1].states).toEqual(['active']);
    expect(matches[2]?.isMatch && matches[2].states).toEqual([]);
  });
});
