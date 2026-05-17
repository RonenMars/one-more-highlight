import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CssHighlight } from '../src/css/CssHighlight.js';
import { __resetSupportedCacheForTests } from '../src/css/supported.js';

describe('<CssHighlight> fallback behavior', () => {
  let originalCSS: unknown;
  let originalHighlight: unknown;

  beforeEach(() => {
    originalCSS = (globalThis as { CSS?: unknown }).CSS;
    originalHighlight = (globalThis as { Highlight?: unknown }).Highlight;
    // Force unsupported environment.
    (globalThis as { CSS?: unknown }).CSS = undefined;
    (globalThis as { Highlight?: unknown }).Highlight = undefined;
    __resetSupportedCacheForTests();
  });
  afterEach(() => {
    (globalThis as { CSS?: unknown }).CSS = originalCSS;
    (globalThis as { Highlight?: unknown }).Highlight = originalHighlight;
    __resetSupportedCacheForTests();
  });

  it('fallback="dom" renders <mark> spans (default behavior)', () => {
    const { container } = render(
      <CssHighlight text="cat cat" searchWords={['cat']} />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveTextContent('cat');
  });

  it('fallback="none" renders plain text without warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <CssHighlight text="cat cat" searchWords={['cat']} fallback="none" />,
    );
    expect(container.querySelectorAll('mark')).toHaveLength(0);
    expect(container.textContent).toBe('cat cat');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('fallback="throw" throws with a clear message on first render', () => {
    // Suppress React's error-boundary noise in test output.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<CssHighlight text="cat" searchWords={['cat']} fallback="throw" />),
    ).toThrow(/CSS\.highlights is not available/i);
    err.mockRestore();
  });
});
