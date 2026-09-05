import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { AccessibleHighlight } from '../src/a11y/AccessibleHighlight.js';
import { MatchAnnouncer } from '../src/a11y/MatchAnnouncer.js';
import type { AccessibilityMode } from '../src/a11y/types.js';

const MODES: AccessibilityMode[] = ['native', 'dual', 'annotated'];

/**
 * Hydrates server-rendered markup for `tree` and fails if React logs a
 * hydration mismatch — the real signal that server and client markup
 * disagree, unlike a raw innerHTML string diff (which also flags harmless
 * inline-style serialization differences between the two renderers).
 */
function expectHydratesCleanly(tree: React.ReactElement): void {
  const server = renderToString(tree);
  const container = document.createElement('div');
  container.innerHTML = server;
  document.body.appendChild(container);

  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    act(() => {
      hydrateRoot(container, tree);
    });
    expect(errorSpy).not.toHaveBeenCalled();
  } finally {
    errorSpy.mockRestore();
    document.body.removeChild(container);
  }
}

describe('SSR: <AccessibleHighlight>', () => {
  for (const mode of MODES) {
    it(`mode="${mode}" produces deterministic markup across runs`, () => {
      const tree = (
        <AccessibleHighlight
          text="cat hat cat dog cat"
          searchWords={['cat', 'dog']}
          mode={mode}
          highlightClassName="hl"
          states={[{ name: 'active', index: 1, className: 'active' }]}
        />
      );
      const a = renderToString(tree);
      const b = renderToString(tree);
      expect(a).toBe(b);
    });

    it(`mode="${mode}" renders without window/document access`, () => {
      expect(() =>
        renderToString(
          <AccessibleHighlight text="hello world" searchWords={['world']} mode={mode} />,
        ),
      ).not.toThrow();
    });

    it(`mode="${mode}" server markup hydrates cleanly on the client`, () => {
      expectHydratesCleanly(
        <AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode={mode} />,
      );
    });
  }

  it('mode="dual" gives every match a unique key across both the aria-hidden and visually-hidden layers', () => {
    // The fragmented aria-hidden layer and the unbroken visually-hidden copy
    // both derive from the same segments; if their keys collided across
    // layers React would warn or silently drop nodes during hydration.
    const html = renderToString(
      <AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode="dual" />,
    );
    // Two <mark> elements in the aria-hidden layer, plus the single
    // unbroken text copy — no duplicate-key React warning would have been
    // thrown during renderToString above (vitest surfaces console errors).
    expect(html.match(/<mark>/g)).toHaveLength(2);
    expect(html).toContain('cat hat cat');
  });

  it('mode="annotated" renders boundary markers deterministically', () => {
    const tree = (
      <AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode="annotated" />
    );
    const a = renderToString(tree);
    const b = renderToString(tree);
    expect(a).toBe(b);
    expect(a).toContain('highlight start');
    expect(a).toContain('highlight end');
  });
});

describe('SSR: <MatchAnnouncer>', () => {
  it('renders safely server-side where timers never fire', () => {
    expect(() =>
      renderToString(<MatchAnnouncer matchCount={3} activeIndex={1} activeMatchText="cat" />),
    ).not.toThrow();
  });

  it('produces deterministic, empty-message markup across runs (debounce never fires during SSR)', () => {
    const tree = <MatchAnnouncer matchCount={3} activeIndex={1} activeMatchText="cat" />;
    const a = renderToString(tree);
    const b = renderToString(tree);
    expect(a).toBe(b);
    expect(a).toContain('role="status"');
    expect(a).toContain('aria-live="polite"');
  });

  it('server markup hydrates cleanly before the debounce timer fires', () => {
    expectHydratesCleanly(<MatchAnnouncer matchCount={0} activeIndex={null} />);
  });
});
