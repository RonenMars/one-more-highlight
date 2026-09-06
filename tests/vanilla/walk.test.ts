import { describe, expect, it } from 'vitest';
import { TextIndex } from '../../src/vanilla/walk.js';

function host(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

describe('TextIndex.from', () => {
  it('flattens text across element boundaries', () => {
    const index = TextIndex.from(host('hello <b>world</b>!'));
    expect(index.text).toBe('hello world!');
  });

  it('skips script, style and noscript content', () => {
    const index = TextIndex.from(
      host('a<script>var x = 1;</script>b<style>.c{}</style>c<noscript>d</noscript>e'),
    );
    expect(index.text).toBe('abce');
  });

  it('collapses whitespace runs, including across node boundaries', () => {
    const index = TextIndex.from(host('a   \n  b<b>  </b>   c'));
    expect(index.text).toBe('a b c');
  });

  it('drops leading whitespace so offsets start at real text', () => {
    const index = TextIndex.from(host('   lead'));
    expect(index.text).toBe('lead');
  });

  it('preserves whitespace when collapsing is off', () => {
    const index = TextIndex.from(host('a   b'), { collapseWhitespace: false });
    expect(index.text).toBe('a   b');
  });

  it('honors a custom text-node filter', () => {
    const el = host('keep<span class="skip">drop</span>keep2');
    const index = TextIndex.from(el, {
      filter: (node) => (node.parentElement as HTMLElement).className !== 'skip',
    });
    expect(index.text).toBe('keepkeep2');
  });
});

describe('TextIndex.slices', () => {
  it('maps a match inside one text node back to source offsets', () => {
    const el = host('hello world');
    const index = TextIndex.from(el);
    const start = index.text.indexOf('world');
    expect(index.slices(start, start + 5)).toEqual([
      { node: el.firstChild, start: 6, end: 11 },
    ]);
  });

  it('splits a cross-element match into one slice per text node', () => {
    const el = host('hello <b>world</b>');
    const index = TextIndex.from(el);
    const start = index.text.indexOf('lo wo');
    const slices = index.slices(start, start + 5);
    expect(slices).toHaveLength(2);
    expect(slices[0]?.node.data).toBe('hello ');
    expect(slices[0]).toMatchObject({ start: 3, end: 6 });
    expect(slices[1]?.node.data).toBe('world');
    expect(slices[1]).toMatchObject({ start: 0, end: 2 });
  });

  it('maps offsets back past a collapsed whitespace run', () => {
    const el = host('a     b');
    const index = TextIndex.from(el);
    expect(index.text).toBe('a b');
    // 'b' is flat offset 2 but source offset 6.
    expect(index.slices(2, 3)).toEqual([{ node: el.firstChild, start: 6, end: 7 }]);
  });

  it('returns nothing for an empty or inverted range', () => {
    const index = TextIndex.from(host('abc'));
    expect(index.slices(1, 1)).toEqual([]);
    expect(index.slices(2, 1)).toEqual([]);
  });

  it('walks open shadow roots when asked, and not otherwise', () => {
    const el = host('light');
    const shadowHost = document.createElement('div');
    shadowHost.attachShadow({ mode: 'open' }).textContent = 'shadow';
    el.appendChild(shadowHost);

    expect(TextIndex.from(el).text).toBe('light');
    expect(TextIndex.from(el, { shadow: true }).text).toBe('lightshadow');
  });
});

describe('TextIndex.toRange', () => {
  it('builds one range spanning an element boundary', () => {
    const el = host('hello <b>world</b>');
    document.body.appendChild(el);
    const index = TextIndex.from(el);
    const start = index.text.indexOf('lo wo');
    const range = index.toRange(start, start + 5);
    expect(range?.toString()).toBe('lo wo');
    el.remove();
  });

  it('returns null when the range covers no text', () => {
    const index = TextIndex.from(host('abc'));
    expect(index.toRange(1, 1)).toBeNull();
  });
});
