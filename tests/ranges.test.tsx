import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Highlight } from '../src/Highlight.js';
import { useHighlight } from '../src/useHighlight.js';
import type { HighlightProps, HighlightRange, MatchSegment } from '../src/types.js';

// --- Type-level: the source is a discriminated union ------------------------
// These assertions are the contract; `pnpm typecheck` covers this file.

const _searchSource: HighlightProps = { text: 't', searchWords: ['a'] };
const _rangeSource: HighlightProps = { text: 't', ranges: [{ start: 0, end: 1 }] };
// An explicit `undefined` for the unused source stays legal — the branches use
// `?: undefined`, not `?: never`, which exactOptionalPropertyTypes would reject.
const _explicitUndefined: HighlightProps = { text: 't', searchWords: ['a'], ranges: undefined };
// @ts-expect-error `searchWords` and `ranges` are mutually exclusive
const _bothSources: HighlightProps = { text: 't', searchWords: ['a'], ranges: [] };
// @ts-expect-error a source is required
const _noSource: HighlightProps = { text: 't' };
// @ts-expect-error matcher options don't apply to a controlled `ranges` source
const _matcherWithRanges: HighlightProps = { text: 't', ranges: [], caseSensitive: true };
const _rangeCtxUnderSearch: HighlightProps = {
  text: 't',
  searchWords: ['a'],
  // @ts-expect-error a range context isn't available under a `searchWords` source
  states: [{ name: 'n', match: (m) => m.range.start === 0 }],
};
const _regexTermUnderRanges: HighlightProps = {
  text: 't',
  ranges: [],
  // @ts-expect-error a RegExp term isn't available under a `ranges` source
  states: [{ name: 'n', match: (m) => m.term instanceof RegExp }],
};
void _searchSource;
void _rangeSource;
void _explicitUndefined;
void _bothSources;
void _noSource;
void _matcherWithRanges;
void _rangeCtxUnderSearch;
void _regexTermUnderRanges;

const TEXT = 'A cat sat on the mat.';

describe('controlled ranges', () => {
  it('segments the text at the supplied offsets', () => {
    const { result } = renderHook(() =>
      useHighlight({ text: TEXT, ranges: [{ start: 2, end: 5 }, { start: 17, end: 20 }] }),
    );
    expect(result.current.segments.map((s) => [s.text, s.isMatch])).toEqual([
      ['A ', false],
      ['cat', true],
      [' sat on the ', false],
      ['mat', true],
      ['.', false],
    ]);
    expect(result.current.getMatchCount()).toBe(2);
  });

  it('never runs the built-in matcher', () => {
    // 'cat' occurs at 2 and would be found by the matcher; only the supplied
    // range survives, proving `ranges` replaces matching rather than adding.
    const { result } = renderHook(() =>
      useHighlight({ text: 'cat cat', ranges: [{ start: 4, end: 7 }] }),
    );
    const matches = result.current.segments.filter((s) => s.isMatch);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.start).toBe(4);
  });

  it('carries the originating range onto the segment', () => {
    const range: HighlightRange = {
      start: 2,
      end: 5,
      id: 'result-1',
      termId: 'cat',
      metadata: { source: 'search' },
    };
    const { result } = renderHook(() => useHighlight({ text: TEXT, ranges: [range] }));
    const match = result.current.segments.find((s): s is MatchSegment => s.isMatch);
    expect(match?.range).toBe(range);
  });

  it('resolves term selectors against termId', () => {
    const { result } = renderHook(() =>
      useHighlight({
        text: TEXT,
        ranges: [
          { start: 2, end: 5, termId: 'cat' },
          { start: 17, end: 20, termId: 'mat' },
        ],
        states: [{ name: 'feline', term: 'cat' }],
      }),
    );
    const matches = result.current.segments.filter((s): s is MatchSegment => s.isMatch);
    expect(matches.map((m) => m.states)).toEqual([['feline'], []]);
  });

  it('feeds predicates a range context', () => {
    const { result } = renderHook(() =>
      useHighlight({
        text: TEXT,
        ranges: [
          { start: 2, end: 5, metadata: { score: 0.9 } },
          { start: 17, end: 20, metadata: { score: 0.2 } },
        ],
        states: [{ name: 'confident', match: (m) => Number(m.range.metadata?.['score']) > 0.5 }],
      }),
    );
    const matches = result.current.segments.filter((s): s is MatchSegment => s.isMatch);
    expect(matches.map((m) => m.states)).toEqual([['confident'], []]);
  });

  it('applies the overlap strategy to overlapping ranges', () => {
    const overlapping: HighlightRange[] = [
      { start: 2, end: 5 },
      { start: 4, end: 9 },
    ];
    const { result: merged } = renderHook(() =>
      useHighlight({ text: TEXT, ranges: overlapping }),
    );
    expect(merged.current.segments.filter((s) => s.isMatch)).toHaveLength(1);

    const { result: nested } = renderHook(() =>
      useHighlight({ text: TEXT, ranges: overlapping, overlapStrategy: 'nest' }),
    );
    expect(nested.current.segments.filter((s) => s.isMatch)).toHaveLength(2);
  });

  it('memoizes on the range contents, not identity', () => {
    let ranges: HighlightRange[] = [{ start: 2, end: 5 }];
    const { result, rerender } = renderHook(() => useHighlight({ text: TEXT, ranges }));
    const first = result.current.segments;

    ranges = [{ start: 2, end: 5 }];
    rerender();
    expect(result.current.segments).toBe(first);

    ranges = [{ start: 2, end: 5, metadata: { score: 1 } }];
    rerender();
    expect(result.current.segments).not.toBe(first);
  });

  it('renders through <Highlight>', () => {
    render(<Highlight text={TEXT} ranges={[{ start: 2, end: 5 }]} highlightClassName="hl" />);
    const mark = screen.getByText('cat');
    expect(mark.tagName).toBe('MARK');
    expect(mark).toHaveClass('hl');
  });

  it('hands the range to renderMatch', () => {
    render(
      <Highlight
        text={TEXT}
        ranges={[{ start: 2, end: 5, id: 'result-1' }]}
        renderMatch={(seg) => <mark data-id={seg.range?.id}>{seg.text}</mark>}
      />,
    );
    expect(screen.getByText('cat')).toHaveAttribute('data-id', 'result-1');
  });
});
