import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { AccessibleHighlight } from '../src/a11y/AccessibleHighlight.js';
import { __resetSupportedCacheForTests } from '../src/css/supported.js';
import type { AccessibilityMode } from '../src/a11y/types.js';

const MODES: AccessibilityMode[] = ['native', 'dual', 'annotated'];

/**
 * What assistive technology is left with: the text of the subtree with every
 * `aria-hidden` branch pruned, plus the accessible text of each element that
 * carries mark semantics, in document order.
 *
 * Deliberately blind to tag names, class names, wrapper depth and inline
 * styles — two engines that reach the same accessible output through
 * different markup must compare equal, or the assertion is testing the
 * implementation instead of the feature.
 */
interface AccessibleOutput {
  text: string;
  marks: string[];
}

function collect(node: Node, out: AccessibleOutput): void {
  if (node.nodeType === Node.TEXT_NODE) {
    out.text += node.textContent ?? '';
    return;
  }
  if (!(node instanceof Element)) return;
  if (node.getAttribute('aria-hidden') === 'true') return;

  const isMark = node.tagName === 'MARK' || node.getAttribute('role') === 'mark';
  const before = out.text.length;
  for (const child of node.childNodes) collect(child, out);
  if (isMark) out.marks.push(out.text.slice(before));
}

function accessibleOutput(root: Element): AccessibleOutput {
  const out: AccessibleOutput = { text: '', marks: [] };
  collect(root, out);
  return out;
}

// --- CSS.highlights stub for jsdom ----------------------------------------

interface StubHighlight {
  ranges: Set<Range>;
  size: number;
  add(r: Range): void;
  delete(r: Range): boolean;
}

function installHighlightStub(): () => void {
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
  return () => {
    (globalThis as { CSS?: unknown }).CSS = originalCSS;
    (globalThis as { Highlight?: unknown }).Highlight = originalHighlight;
  };
}

const CASES = [
  {
    name: 'plain matches',
    props: { text: 'cat hat cat', searchWords: ['cat'] },
  },
  {
    name: 'multi-state matches',
    props: {
      text: 'cat hat cat dog cat',
      searchWords: ['cat', 'dog'],
      states: [{ name: 'active', index: 1, className: 'active' }],
      highlightClassName: 'hl',
    },
  },
  {
    name: 'controlled ranges',
    props: { text: 'abcdefghij', ranges: [{ start: 2, end: 5 }] },
  },
  {
    name: 'no matches at all',
    props: { text: 'nothing here', searchWords: ['zzz'] },
  },
] as const;

describe('engine parity: <AccessibleHighlight engine="dom"> vs engine="css"', () => {
  describe('in a browser that supports CSS Custom Highlights', () => {
    let uninstall: () => void;
    beforeEach(() => {
      uninstall = installHighlightStub();
      __resetSupportedCacheForTests();
    });
    afterEach(() => {
      uninstall();
      __resetSupportedCacheForTests();
    });

    for (const mode of MODES) {
      for (const { name, props } of CASES) {
        it(`mode="${mode}" — ${name}`, () => {
          const dom = render(<AccessibleHighlight {...props} mode={mode} engine="dom" />);
          const css = render(<AccessibleHighlight {...props} mode={mode} engine="css" />);
          expect(accessibleOutput(css.container)).toEqual(
            accessibleOutput(dom.container),
          );
        });
      }
    }

    it('the comparison is discriminating — each mode has a distinct accessible output', () => {
      // Guards the equality assertions above from passing vacuously: if
      // `accessibleOutput` ever returned an empty shape for everything, every
      // parity test would still be green while proving nothing.
      const props = { text: 'cat hat cat', searchWords: ['cat'] };
      const out = (mode: AccessibilityMode) =>
        accessibleOutput(render(<AccessibleHighlight {...props} mode={mode} engine="css" />).container);

      expect(out('native')).toEqual({ text: 'cat hat cat', marks: ['cat', 'cat'] });
      expect(out('dual')).toEqual({ text: 'cat hat cat', marks: [] });
      expect(out('annotated')).toEqual({
        text: 'highlight startcathighlight end hat highlight startcathighlight end',
        marks: ['highlight startcathighlight end', 'highlight startcathighlight end'],
      });
    });

    it('mode="dual" adds zero DOM nodes per match on the CSS engine', () => {
      const few = render(
        <AccessibleHighlight text="cat hat" searchWords={['cat']} mode="dual" engine="css" />,
      );
      const many = render(
        <AccessibleHighlight
          text="cat cat cat cat cat cat cat cat"
          searchWords={['cat']}
          mode="dual"
          engine="css"
        />,
      );
      // 1 match vs 8; if the element count moves at all, a per-match node crept in.
      expect(many.container.querySelectorAll('*')).toHaveLength(
        few.container.querySelectorAll('*').length,
      );
      expect(many.container.querySelectorAll('mark')).toHaveLength(0);
    });
  });

  describe('in a browser without CSS Custom Highlight support', () => {
    let originalCSS: unknown;
    let originalHighlight: unknown;
    beforeEach(() => {
      originalCSS = (globalThis as { CSS?: unknown }).CSS;
      originalHighlight = (globalThis as { Highlight?: unknown }).Highlight;
      (globalThis as { CSS?: unknown }).CSS = undefined;
      (globalThis as { Highlight?: unknown }).Highlight = undefined;
      __resetSupportedCacheForTests();
    });
    afterEach(() => {
      (globalThis as { CSS?: unknown }).CSS = originalCSS;
      (globalThis as { Highlight?: unknown }).Highlight = originalHighlight;
      __resetSupportedCacheForTests();
    });

    for (const mode of MODES) {
      it(`mode="${mode}" — the DOM fallback does not leak extra semantics`, () => {
        const props = { text: 'cat hat cat', searchWords: ['cat'] };
        const dom = render(<AccessibleHighlight {...props} mode={mode} engine="dom" />);
        const css = render(<AccessibleHighlight {...props} mode={mode} engine="css" />);
        expect(accessibleOutput(css.container)).toEqual(
          accessibleOutput(dom.container),
        );
      });
    }
  });
});
