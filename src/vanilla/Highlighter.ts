import { supported } from '../css/supported.js';
import { IMPLICIT_HIGHLIGHT_NAME } from '../css/types.js';
import { highlight } from './core.js';
import { paintCss } from './renderers/css.js';
import { paintMark } from './renderers/mark.js';
import { TextIndex } from './walk.js';
import type {
  HighlightRange,
  HighlighterOptions,
  HighlightState,
  MarkOptions,
  RenderStrategy,
} from './types.js';
import type { RangeMatchContext } from '../types.js';

/**
 * Highlights text anywhere in a DOM subtree, with no framework and no DOM
 * ownership: it reads the subtree, and either registers `Range`s with
 * `CSS.highlights` (leaving the DOM untouched) or injects `<mark>` elements
 * where that API is missing.
 */
export class Highlighter {
  private readonly root: Element | Document | DocumentFragment;
  private readonly opts: Required<Pick<HighlighterOptions, 'name' | 'markClassName' | 'markTag' | 'overlapStrategy'>> &
    HighlighterOptions;
  private readonly strategy: Exclude<RenderStrategy, 'auto'>;
  private teardown: (() => void) | null = null;

  constructor(root: Element | Document | DocumentFragment, opts: HighlighterOptions = {}) {
    this.root = root;
    this.opts = {
      ...opts,
      name: opts.name ?? IMPLICIT_HIGHLIGHT_NAME,
      markClassName: opts.markClassName ?? 'omh-match',
      markTag: opts.markTag ?? 'mark',
      overlapStrategy: opts.overlapStrategy ?? 'merge',
    };
    const requested = opts.strategy ?? 'auto';
    this.strategy = requested === 'auto' ? (supported() ? 'css' : 'mark') : requested;
  }

  /** Which renderer this instance resolved to. */
  get renderer(): Exclude<RenderStrategy, 'auto'> {
    return this.strategy;
  }

  /**
   * Highlights every match of `query` under the root, replacing any previous
   * marking by this instance. Returns the number of matches painted.
   */
  mark(
    query: string | RegExp | ReadonlyArray<string | RegExp>,
    markOpts: MarkOptions = {},
  ): number {
    const searchWords = Array.isArray(query)
      ? (query as ReadonlyArray<string | RegExp>)
      : [query as string | RegExp];
    return this.paint((index) =>
      highlight({
        text: index.text,
        searchWords,
        overlapStrategy: this.opts.overlapStrategy,
        caseSensitive: markOpts.caseSensitive ?? false,
        autoEscape: markOpts.autoEscape ?? true,
        ...(markOpts.sanitize !== undefined && { sanitize: markOpts.sanitize }),
        ...(markOpts.states !== undefined && { states: markOpts.states }),
      }),
      markOpts.states,
    );
  }

  /**
   * Highlights precomputed offsets instead of searching — the vanilla parity
   * for the core's `ranges` prop. Offsets are into the *flattened* subtree
   * text, which `text` exposes.
   */
  markRanges(
    ranges: ReadonlyArray<HighlightRange>,
    states?: ReadonlyArray<HighlightState<RangeMatchContext>>,
  ): number {
    return this.paint(
      (index) =>
        highlight({
          text: index.text,
          ranges,
          overlapStrategy: this.opts.overlapStrategy,
          ...(states !== undefined && { states }),
        }),
      states,
    );
  }

  /** The flattened text of the subtree, as the matcher sees it. */
  get text(): string {
    return TextIndex.from(this.root, this.opts).text;
  }

  /** Removes this instance's highlights, restoring the DOM under the `mark` renderer. */
  unmark(): void {
    this.teardown?.();
    this.teardown = null;
  }

  /** Alias for {@link unmark}, for symmetry with other teardown APIs. */
  destroy(): void {
    this.unmark();
  }

  private paint(
    compute: (index: TextIndex) => ReturnType<typeof highlight>,
    // Only the styling fields are read here — never the selector, and never a
    // predicate — so this deliberately does not take `HighlightState`: a
    // predicate written for one source's context isn't assignable to a
    // union-context one.
    states: ReadonlyArray<{ name: string; className?: string | undefined }> | undefined,
  ): number {
    this.unmark();
    const index = TextIndex.from(this.root, this.opts);
    const segments = compute(index);
    const count = segments.reduce((n, s) => (s.isMatch ? n + 1 : n), 0);
    if (count === 0) return 0;

    if (this.strategy === 'css') {
      this.teardown = paintCss(index, segments, { name: this.opts.name });
    } else {
      const stateClasses = new Map<string, string>();
      for (const s of states ?? []) {
        if (s.className) stateClasses.set(s.name, s.className);
      }
      this.teardown = paintMark(index, segments, {
        tag: this.opts.markTag,
        className: this.opts.markClassName,
        stateClasses,
      });
    }
    return count;
  }
}
