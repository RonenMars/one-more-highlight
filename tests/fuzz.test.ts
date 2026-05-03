import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { defaultFindChunks } from '../src/findMatches.js';
import { combineChunks } from '../src/combineChunks.js';
import { applyStates } from '../src/applyStates.js';
import { buildSegments } from '../src/buildSegments.js';

function pipeline(text: string, terms: string[]): string {
  const raw = defaultFindChunks({
    searchWords: terms,
    textToHighlight: text,
    caseSensitive: false,
    autoEscape: true,
  });
  const combined = combineChunks(raw, 'merge');
  const tagged = applyStates(combined, undefined);
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
});
