import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Highlight } from '../src/Highlight.js';
import { CssHighlight } from '../src/css/CssHighlight.js';
import type { HighlightRange, OverlapStrategy } from '../src/types.js';

const TEXT = 'A cat sat on the mat.';

// Under `searchWords` the matcher guarantees well-formed, ordered,
// non-overlapping-by-construction offsets. Under `ranges` they come straight
// from a consumer — a search backend, a tokenizer, an LLM — and can be
// anything. React keys derive from segment offsets, so a collision here
// surfaces as a hydration mismatch rather than a cosmetic bug.
const ADVERSARIAL: ReadonlyArray<HighlightRange> = [
  { start: 2, end: 5 },   // 'cat'
  { start: 2, end: 5 },   // exact duplicate
  { start: 17, end: 20 }, // 'mat' — later in the text than the entry after it
  { start: 6, end: 9 },   // 'sat' — out of document order
  { start: 4, end: 8 },   // straddles 'cat' and 'sat'
  { start: 10, end: 10 }, // zero-length
  { start: 12, end: 7 },  // inverted
  { start: -3, end: 3 },  // negative start
  { start: 18, end: 99 }, // runs past the end of the text
];

const STRATEGIES: ReadonlyArray<OverlapStrategy> = ['merge', 'nest', 'first-wins'];

/**
 * Server-renders, hydrates that markup, and collects everything React
 * complained about. Hydration is the only place a duplicate key is
 * observable — `renderToString` alone is silent about them.
 */
async function hydrateSsrMarkup(element: ReactElement): Promise<string[]> {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);

  const complaints: string[] = [];
  const spy = vi
    .spyOn(console, 'error')
    .mockImplementation((...args: unknown[]) => void complaints.push(String(args[0])));
  try {
    await act(async () => {
      hydrateRoot(container, element, {
        onRecoverableError: (error) => void complaints.push(String(error)),
      });
    });
  } finally {
    spy.mockRestore();
    container.remove();
  }
  return complaints;
}

describe('SSR with controlled ranges', () => {
  it('produces deterministic markup across runs', () => {
    const tree = (
      <Highlight
        text={TEXT}
        ranges={[
          { start: 2, end: 5, id: 'r1', termId: 'cat', metadata: { score: 0.9 } },
          { start: 17, end: 20, id: 'r2', termId: 'mat' },
        ]}
        highlightClassName="hl"
        states={[{ name: 'confident', match: (m) => Number(m.range.metadata?.['score']) > 0.5 }]}
      />
    );
    expect(renderToString(tree)).toBe(renderToString(tree));
  });

  it.each(STRATEGIES)('hydrates adversarial ranges cleanly under %s', async (overlapStrategy) => {
    const complaints = await hydrateSsrMarkup(
      <Highlight text={TEXT} ranges={ADVERSARIAL} overlapStrategy={overlapStrategy} />,
    );
    expect(complaints).toEqual([]);
  });

  it('renders the full text exactly once despite clamped and dropped ranges', () => {
    const html = renderToString(<Highlight text={TEXT} ranges={ADVERSARIAL} />);
    expect(html.replace(/<[^>]+>/g, '')).toBe(TEXT);
  });

  it('renders without window/document access', () => {
    const win = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const doc = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'document');
    try {
      expect(renderToString(<Highlight text={TEXT} ranges={[{ start: 2, end: 5 }]} />)).toContain(
        '<mark>cat</mark>',
      );
    } finally {
      if (win) Object.defineProperty(globalThis, 'window', win);
      if (doc) Object.defineProperty(globalThis, 'document', doc);
    }
  });
});

describe('<CssHighlight> SSR with controlled ranges', () => {
  it('produces deterministic markup across runs', () => {
    const tree = (
      <CssHighlight
        text={TEXT}
        ranges={[{ start: 2, end: 5, termId: 'cat' }, { start: 17, end: 20, termId: 'mat' }]}
        states={[{ name: 'feline', term: 'cat' }]}
        fallback="none"
      />
    );
    expect(renderToString(tree)).toBe(renderToString(tree));
  });

  it('renders wrapper + raw text only — no <mark> elements', () => {
    const html = renderToString(
      <CssHighlight text={TEXT} ranges={ADVERSARIAL} fallback="none" />,
    );
    expect(html).not.toContain('<mark');
    expect(html).toContain(TEXT);
  });

  it.each(STRATEGIES)(
    'hydrates adversarial ranges cleanly under %s (dom fallback)',
    async (overlapStrategy) => {
      // `CSS.highlights` is absent in both renderers here, so this exercises
      // the `fallback="dom"` branch on the server *and* the client.
      const complaints = await hydrateSsrMarkup(
        <CssHighlight text={TEXT} ranges={ADVERSARIAL} overlapStrategy={overlapStrategy} />,
      );
      expect(complaints).toEqual([]);
    },
  );
});
