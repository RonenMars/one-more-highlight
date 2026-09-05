import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { defaultFindChunks } from '../src/findMatches.js';
import { combineChunks } from '../src/combineChunks.js';
import { applyStates } from '../src/applyStates.js';
import { buildSegments } from '../src/buildSegments.js';
import { chunksFromRanges } from '../src/fromRanges.js';
import type { HighlightRange, OverlapStrategy } from '../src/types.js';

function pipeline(text: string, terms: string[]): string {
  const raw = defaultFindChunks({
    searchWords: terms,
    textToHighlight: text,
    caseSensitive: false,
    autoEscape: true,
  });
  const combined = combineChunks(raw, 'merge');
  const tagged = applyStates(combined, undefined, terms, text);
  return buildSegments(text, tagged).map((s) => s.text).join('');
}

describe('fuzz: pipeline preserves text', () => {
  it('joined segments always equal input text', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 200 }),
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), { maxLength: 5 }),
        (text, terms) => {
          expect(pipeline(text, terms)).toBe(text);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('match count equals brute-force oracle (single term)', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 4 }),
        (text, term) => {
          const lo = text.toLowerCase();
          const t = term.toLowerCase();
          let oracle = 0;
          let i = 0;
          while (t.length > 0 && (i = lo.indexOf(t, i)) !== -1) {
            oracle++;
            i += t.length;
          }
          const raw = defaultFindChunks({
            searchWords: [term],
            textToHighlight: text,
            caseSensitive: false,
            autoEscape: true,
          });
          expect(raw.length).toBe(oracle);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('term: i only tags matches whose underlying termIndex equals i', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[a-z]{1,4}$/), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.nat({ max: 4 }),
        (searchWords, text, termPick) => {
          const t = termPick % searchWords.length;
          const raw = defaultFindChunks({
            searchWords,
            textToHighlight: text,
            caseSensitive: false,
            autoEscape: true,
          });
          const combined = combineChunks(raw, 'merge');
          const tagged = applyStates(
            combined,
            [{ name: 'pick', term: t, silent: true }],
            searchWords,
            text,
          );
          for (const c of tagged) {
            if (c.states.includes('pick')) {
              // The tag should only land on chunks whose termIndex === t.
              // With overlap strategy 'merge', termIndex on a surviving chunk is
              // the termIndex of whichever raw match started the merged block.
              expect(c.termIndex).toBe(t);
            }
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});

// A `ranges` source is unvalidated consumer input, so the generator deliberately
// straddles the text bounds in both directions: offsets run to ±5 past a text of
// at most 20 characters, which makes inverted, zero-length, partially clamped
// and fully out-of-bounds ranges all common draws rather than rare corners.
const rangeArb: fc.Arbitrary<HighlightRange> = fc
  .tuple(
    fc.integer({ min: -5, max: 25 }),
    fc.integer({ min: -5, max: 25 }),
    fc.constantFrom<string | undefined>('a', 'b', 'c', undefined),
  )
  .map(([start, end, termId]) =>
    termId === undefined ? { start, end } : { start, end, termId },
  );

function rangesPipeline(
  text: string,
  ranges: ReadonlyArray<HighlightRange>,
  strategy: OverlapStrategy,
): string {
  const { chunks, terms } = chunksFromRanges(ranges, text.length);
  const combined = combineChunks(chunks, strategy);
  const tagged = applyStates(combined, undefined, terms, text);
  return buildSegments(text, tagged).map((s) => s.text).join('');
}

describe('fuzz: controlled ranges', () => {
  it('joined segments always equal input text', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 20 }),
        fc.array(rangeArb, { maxLength: 8 }),
        // 'nest' is excluded by design: it emits overlapping chunks, so
        // buildSegments repeats the overlap and the join is expected to differ.
        fc.constantFrom<OverlapStrategy>('merge', 'first-wins'),
        (text, ranges, strategy) => {
          expect(rangesPipeline(text, ranges, strategy)).toBe(text);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('clamps to the text bounds and drops empty or inverted ranges', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }),
        fc.array(rangeArb, { maxLength: 8 }),
        (textLength, ranges) => {
          const survivors = ranges.filter(
            (r) => Math.max(0, r.start) < Math.min(textLength, r.end),
          );
          const { chunks } = chunksFromRanges(ranges, textLength);

          expect(chunks).toHaveLength(survivors.length);
          chunks.forEach((c, i) => {
            const r = survivors[i];
            // Input order is preserved and the source object is carried by identity.
            expect(c.range).toBe(r);
            expect(c.start).toBe(Math.max(0, r!.start));
            expect(c.end).toBe(Math.min(textLength, r!.end));
            expect(c.start).toBeGreaterThanOrEqual(0);
            expect(c.end).toBeLessThanOrEqual(textLength);
            expect(c.end).toBeGreaterThan(c.start);
          });
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('numbers termIds by first appearance among the surviving ranges', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }),
        fc.array(rangeArb, { maxLength: 8 }),
        (textLength, ranges) => {
          const { chunks, terms } = chunksFromRanges(ranges, textLength);

          const firstAppearance: string[] = [];
          for (const c of chunks) {
            const termId = c.range?.termId;
            if (termId !== undefined && !firstAppearance.includes(termId)) {
              firstAppearance.push(termId);
            }
          }
          expect(terms).toEqual(firstAppearance);

          for (const c of chunks) {
            const termId = c.range?.termId;
            expect(c.termIndex).toBe(termId === undefined ? -1 : terms.indexOf(termId));
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});
