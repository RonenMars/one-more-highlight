import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { CssHighlight } from '../src/css/CssHighlight.js';
import { __resetSupportedCacheForTests } from '../src/css/supported.js';

describe('<CssHighlight>', () => {
  it('renders a single Text node child inside the wrapper', () => {
    const { container } = render(
      <CssHighlight text="hello world" searchWords={['world']} fallback="none" />,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.tagName).toBe('SPAN');
    expect(wrapper?.childNodes).toHaveLength(1);
    expect(wrapper?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(wrapper?.firstChild?.textContent).toBe('hello world');
  });

  it('renders zero <mark> elements', () => {
    const { container } = render(
      <CssHighlight text="cat cat cat" searchWords={['cat']} fallback="none" />,
    );
    expect(container.querySelectorAll('mark')).toHaveLength(0);
  });

  it('honors the `as` prop to change the wrapper tag', () => {
    const { container } = render(
      <CssHighlight text="abc" searchWords={[]} as="div" fallback="none" />,
    );
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('forwards className and style to the wrapper', () => {
    const { container } = render(
      <CssHighlight
        text="abc"
        searchWords={[]}
        className="outer"
        style={{ color: 'red' }}
        fallback="none"
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('outer');
    expect(wrapper.style.color).toBe('red');
  });
});

// --- CSS.highlights stub for jsdom ----------------------------------------

interface StubHighlight {
  ranges: Set<Range>;
  size: number;
  add(r: Range): void;
  delete(r: Range): boolean;
}

function installHighlightStub(): {
  registry: Map<string, StubHighlight>;
  cleanup: () => void;
} {
  const registry = new Map<string, StubHighlight>();
  const originalCSS = (globalThis as { CSS?: unknown }).CSS;
  const originalHighlight = (globalThis as { Highlight?: unknown }).Highlight;

  class HighlightStub implements StubHighlight {
    ranges: Set<Range>;
    size: number;
    constructor(...ranges: Range[]) {
      this.ranges = new Set(ranges);
      this.size = this.ranges.size;
    }
    add(r: Range) { this.ranges.add(r); this.size = this.ranges.size; }
    delete(r: Range) {
      const ok = this.ranges.delete(r);
      this.size = this.ranges.size;
      return ok;
    }
  }

  (globalThis as { Highlight?: unknown }).Highlight = HighlightStub;
  (globalThis as { CSS?: unknown }).CSS = {
    highlights: {
      get: (name: string) => registry.get(name),
      set: (name: string, h: StubHighlight) => { registry.set(name, h); },
      delete: (name: string) => registry.delete(name),
    },
  };
  return {
    registry,
    cleanup: () => {
      (globalThis as { CSS?: unknown }).CSS = originalCSS;
      (globalThis as { Highlight?: unknown }).Highlight = originalHighlight;
    },
  };
}

describe('<CssHighlight> registry mechanics', () => {
  let env: ReturnType<typeof installHighlightStub>;

  beforeEach(() => {
    env = installHighlightStub();
    __resetSupportedCacheForTests();
  });
  afterEach(() => {
    env.cleanup();
    __resetSupportedCacheForTests();
  });

  it('registers one Range per match under the implicit "match" name', () => {
    render(
      <CssHighlight text="cat hat cat" searchWords={['cat']} />,
    );
    const matchEntry = env.registry.get('match');
    expect(matchEntry).toBeDefined();
    expect(matchEntry!.size).toBe(2);
  });

  it('registers stateful matches under their state names', () => {
    render(
      <CssHighlight
        text="cat cat cat"
        searchWords={['cat']}
        states={[{ name: 'active', index: 1 }]}
      />,
    );
    expect(env.registry.get('active')?.size).toBe(1);
    // Per spec: implicit 'match' is only for matches with zero states.
    // The stateful match (index 1) is NOT tagged with implicit 'match',
    // but the other two matches (no states) ARE.
    expect(env.registry.get('match')?.size).toBe(2);
  });

  it('does NOT tag a match with implicit "match" when it already has states', () => {
    render(
      <CssHighlight
        text="cat cat"
        searchWords={['cat']}
        states={[{ name: 'active', range: [0, 1] }]}
      />,
    );
    // Both matches are in 'active' (range covers both indices).
    expect(env.registry.get('active')?.size).toBe(2);
    // 'match' registry stays empty / unset since every match has a state.
    expect(env.registry.get('match')).toBeUndefined();
  });

  it('removes only its own ranges on unmount, leaving sibling instances intact', () => {
    const { unmount: unmountA } = render(
      <CssHighlight text="cat cat" searchWords={['cat']} />,
    );
    expect(env.registry.get('match')?.size).toBe(2);
    const { unmount: unmountB } = render(
      <CssHighlight text="cat cat cat" searchWords={['cat']} />,
    );
    expect(env.registry.get('match')?.size).toBe(5);

    unmountA();
    expect(env.registry.get('match')?.size).toBe(3); // B's three matches remain

    unmountB();
    expect(env.registry.get('match')).toBeUndefined(); // empty → deleted
  });

  it('rebuilds ranges when text changes', () => {
    const { rerender } = render(
      <CssHighlight text="cat cat" searchWords={['cat']} />,
    );
    expect(env.registry.get('match')?.size).toBe(2);
    rerender(<CssHighlight text="cat cat cat cat" searchWords={['cat']} />);
    expect(env.registry.get('match')?.size).toBe(4);
  });

  it('reaches the same end state under React.StrictMode double-invoke', () => {
    render(
      <StrictMode>
        <CssHighlight text="cat cat cat" searchWords={['cat']} />
      </StrictMode>,
    );
    // The strict-mode cycle: mount → cleanup → mount. The final
    // 'match' highlight should contain exactly 3 ranges, not 6 and not 0.
    expect(env.registry.get('match')?.size).toBe(3);
  });
});
