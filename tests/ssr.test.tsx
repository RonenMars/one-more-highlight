import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Highlight } from '../src/Highlight.js';
import { match } from '../src/match.js';

describe('SSR', () => {
  it('produces deterministic markup across runs', () => {
    const tree = (
      <Highlight
        text="cat hat cat dog cat"
        searchWords={['cat', 'dog']}
        highlightClassName="hl"
        states={[{ name: 'active', ...match.one(1), className: 'active' }]}
      />
    );
    const a = renderToString(tree);
    const b = renderToString(tree);
    expect(a).toBe(b);
  });

  it('renders without window/document access', () => {
    const html = renderToString(
      <Highlight text="hello world" searchWords={['world']} />,
    );
    expect(html).toContain('<mark>world</mark>');
  });
});
