import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetSupportedCacheForTests } from '../../src/css/supported.js';
import { Highlighter } from '../../src/vanilla/Highlighter.js';

function host(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
  delete (globalThis as { CSS?: unknown }).CSS;
  delete (globalThis as { Highlight?: unknown }).Highlight;
  __resetSupportedCacheForTests();
});

describe('strategy resolution', () => {
  it('falls back to the mark renderer when CSS.highlights is missing', () => {
    expect(new Highlighter(host('a')).renderer).toBe('mark');
  });

  it('honors an explicit strategy over feature detection', () => {
    expect(new Highlighter(host('a'), { strategy: 'css' }).renderer).toBe('css');
  });
});

describe('mark renderer', () => {
  it('wraps every match and reports the count', () => {
    const el = host('time time time');
    const count = new Highlighter(el).mark('time');
    expect(count).toBe(3);
    expect(el.querySelectorAll('mark')).toHaveLength(3);
    expect(el.textContent).toBe('time time time');
  });

  it('wraps a match that spans an element boundary, one wrapper per node', () => {
    const el = host('hello <b>world</b>');
    const count = new Highlighter(el).mark('lo wo');
    expect(count).toBe(1);
    expect(el.querySelectorAll('mark')).toHaveLength(2);
    expect(el.textContent).toBe('hello world');
  });

  it('applies per-state classes and exposes state names', () => {
    const el = host('time time time');
    new Highlighter(el).mark('time', {
      states: [{ name: 'active', index: 1, className: 'is-active' }],
    });
    const marks = [...el.querySelectorAll('mark')];
    expect(marks[0]?.className).toBe('omh-match');
    expect(marks[1]?.className).toBe('omh-match is-active');
    expect(marks[1]?.getAttribute('data-omh-states')).toBe('active');
  });

  it('restores the original DOM on unmark', () => {
    const el = host('hello <b>world</b> again');
    const before = el.innerHTML;
    const h = new Highlighter(el);
    h.mark('o w');
    expect(el.innerHTML).not.toBe(before);
    h.unmark();
    expect(el.innerHTML).toBe(before);
    expect(el.childNodes).toHaveLength(3);
  });

  it('replaces the previous marking rather than stacking it', () => {
    const el = host('time time');
    const h = new Highlighter(el);
    h.mark('time');
    h.mark('time');
    expect(el.querySelectorAll('mark')).toHaveLength(2);
  });

  it('returns 0 and touches nothing when there is no match', () => {
    const el = host('hello');
    const before = el.innerHTML;
    expect(new Highlighter(el).mark('zzz')).toBe(0);
    expect(el.innerHTML).toBe(before);
  });
});

describe('multi-state selectors', () => {
  it('layers states by index, range and list', () => {
    const el = host('a a a a a');
    new Highlighter(el).mark('a', {
      states: [
        { name: 'one', index: 2, className: 'c-one' },
        { name: 'span', range: [0, 1], className: 'c-span' },
        { name: 'list', indices: [0, 4], className: 'c-list' },
      ],
    });
    const states = [...el.querySelectorAll('mark')].map(
      (m) => m.getAttribute('data-omh-states') ?? '',
    );
    expect(states).toEqual(['span list', 'span', 'one', '', 'list']);
  });

  it('accepts precomputed ranges over the flattened text', () => {
    const el = host('hello <b>world</b>');
    const h = new Highlighter(el);
    expect(h.text).toBe('hello world');
    const count = h.markRanges([{ start: 6, end: 11 }], [
      { name: 'cited', index: 0, className: 'c-cited' },
    ]);
    expect(count).toBe(1);
    expect(el.querySelector('mark')?.className).toBe('omh-match c-cited');
    expect(el.querySelector('mark')?.textContent).toBe('world');
  });
});

describe('css renderer', () => {
  // The real `Highlight` takes ranges as varargs, not as one iterable.
  class FakeHighlight extends Set<Range> {
    type = 'highlight';
    constructor(...ranges: Range[]) {
      super(ranges);
    }
  }

  beforeEach(() => {
    (globalThis as { CSS?: unknown }).CSS = { highlights: new Map() };
    (globalThis as { Highlight?: unknown }).Highlight = FakeHighlight;
    __resetSupportedCacheForTests();
  });

  const registry = (): Map<string, Set<Range>> =>
    (globalThis as unknown as { CSS: { highlights: Map<string, Set<Range>> } }).CSS.highlights;

  it('registers ranges under the implicit name without touching the DOM', () => {
    const el = host('time time time');
    const before = el.innerHTML;
    const count = new Highlighter(el).mark('time');
    expect(count).toBe(3);
    expect(el.innerHTML).toBe(before);
    expect(registry().get('match')?.size).toBe(3);
  });

  it('registers one named highlight per state', () => {
    const el = host('a a a');
    new Highlighter(el).mark('a', {
      states: [{ name: 'active', index: 1 }],
    });
    expect(registry().get('match')?.size).toBe(2);
    expect(registry().get('active')?.size).toBe(1);
  });

  it('paints a cross-element match as a single range', () => {
    const el = host('hello <b>world</b>');
    new Highlighter(el).mark('lo wo');
    const ranges = [...(registry().get('match') ?? [])];
    expect(ranges).toHaveLength(1);
    expect(ranges[0]?.toString()).toBe('lo wo');
  });

  it('deregisters its ranges on unmark', () => {
    const el = host('time time');
    const h = new Highlighter(el);
    h.mark('time');
    expect(registry().has('match')).toBe(true);
    h.unmark();
    expect(registry().has('match')).toBe(false);
  });

  it('leaves another instance ranges alone when one tears down', () => {
    const a = host('shared shared');
    const b = host('shared shared');
    const ha = new Highlighter(a);
    const hb = new Highlighter(b);
    ha.mark('shared');
    hb.mark('shared');
    expect(registry().get('match')?.size).toBe(4);
    ha.unmark();
    expect(registry().get('match')?.size).toBe(2);
  });
});
