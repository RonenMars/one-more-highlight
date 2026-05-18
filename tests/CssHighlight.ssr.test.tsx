import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CssHighlight } from '../src/css/CssHighlight.js';

describe('<CssHighlight> SSR', () => {
  it('renders wrapper + raw text only — no <mark> elements', () => {
    const html = renderToString(
      <CssHighlight text="cat hat cat" searchWords={['cat']} fallback="none" />,
    );
    expect(html).not.toContain('<mark');
    expect(html).toContain('cat hat cat');
  });

  it('produces deterministic markup across runs', () => {
    const tree = (
      <CssHighlight
        text="cat hat cat dog cat"
        searchWords={['cat', 'dog']}
        states={[{ name: 'active', index: 1 }]}
        fallback="none"
      />
    );
    const a = renderToString(tree);
    const b = renderToString(tree);
    expect(a).toBe(b);
  });

  it('does not access window/document/CSS during render', () => {
    // renderToString on Node would throw if we touched these.
    expect(() =>
      renderToString(<CssHighlight text="abc" searchWords={['a']} fallback="none" />),
    ).not.toThrow();
  });

  it('fallback="dom" SSRs as <Highlight> would (with <mark>)', () => {
    const html = renderToString(
      <CssHighlight text="cat cat" searchWords={['cat']} />,
    );
    // In SSR, CSS.highlights is undefined → 'dom' fallback path renders <mark>.
    expect(html).toMatch(/<mark[^>]*>cat<\/mark>/);
  });

  it('fallback="throw" rejects on the server', () => {
    expect(() =>
      renderToString(<CssHighlight text="cat" searchWords={['cat']} fallback="throw" />),
    ).toThrow(/CSS\.highlights is not available/i);
  });
});
