import type {
  HighlightRange,
  HighlightStateMany as CoreHighlightStateMany,
  HighlightStateOne as CoreHighlightStateOne,
  HighlightStatePredicate as CoreHighlightStatePredicate,
  HighlightStateRange as CoreHighlightStateRange,
  HighlightStateTerm as CoreHighlightStateTerm,
  HighlightStateTermNth as CoreHighlightStateTermNth,
  MatchContext,
  MatcherOptions,
  OverlapStrategy,
  RangeMatchContext,
  SearchMatchContext,
  Segment,
} from '../types.js';

/**
 * Vanilla flavor of the core `HighlightState` union.
 *
 * The selector fields are identical to the web package — they drive the shared
 * matching pipeline. Only the styling surface differs: a state names a CSS
 * highlight (`::highlight(<name>)`) under the `css` renderer and contributes
 * `className` under the `mark` renderer, so the DOM `style` object has no
 * meaning here.
 *
 * Note the emitted `.d.ts` still carries a bare `import 'react'` from the
 * shared type chunk. It is inert under `skipLibCheck: true` (verified against a
 * project with no React types installed at all); a consumer who turns
 * `skipLibCheck` off needs `@types/react` present. Removing it means splitting
 * the React-flavored types out of `../types.ts`, which is not worth the churn
 * until someone actually hits it.
 */
type WithoutDomStyle<S> = S extends { name: string } ? Omit<S, 'style'> : never;

export type HighlightStateOne = WithoutDomStyle<CoreHighlightStateOne>;
export type HighlightStateRange = WithoutDomStyle<CoreHighlightStateRange>;
export type HighlightStateMany = WithoutDomStyle<CoreHighlightStateMany>;
export type HighlightStateTerm = WithoutDomStyle<CoreHighlightStateTerm>;
export type HighlightStateTermNth = WithoutDomStyle<CoreHighlightStateTermNth>;
export type HighlightStatePredicate<Ctx = MatchContext> = WithoutDomStyle<
  CoreHighlightStatePredicate<Ctx>
>;

export type HighlightState<Ctx = MatchContext> =
  | HighlightStateOne
  | HighlightStateRange
  | HighlightStateMany
  | HighlightStateTerm
  | HighlightStateTermNth
  | HighlightStatePredicate<Ctx>;

/**
 * Source union for the headless {@link highlight} function. Mirrors the core
 * `HighlightSource`: `searchWords` and `ranges` are mutually exclusive at the
 * type level, and each carries the state context its predicates are written
 * against.
 */
export type VanillaSource =
  | (MatcherOptions & {
      searchWords: ReadonlyArray<string | RegExp>;
      states?: ReadonlyArray<HighlightState<SearchMatchContext>>;
      ranges?: undefined;
    })
  | ({ [K in keyof MatcherOptions]?: undefined } & {
      ranges: ReadonlyArray<HighlightRange>;
      states?: ReadonlyArray<HighlightState<RangeMatchContext>>;
      searchWords?: undefined;
    });

export type HighlightOptions = {
  text: string;
  overlapStrategy?: OverlapStrategy;
} & VanillaSource;

/** Which renderer paints the matches. `auto` picks `css` when supported. */
export type RenderStrategy = 'auto' | 'css' | 'mark';

export interface WalkOptions {
  /**
   * Collapse each run of whitespace to a single space before matching, so a
   * query typed as one space matches text broken across source lines.
   * Defaults to `true`.
   */
  collapseWhitespace?: boolean;
  /** Return `false` to exclude a text node. `<script>`/`<style>`/`<noscript>` are always excluded. */
  filter?: (node: Text) => boolean;
  /** Also walk into open shadow roots beneath the root. Defaults to `false`. */
  shadow?: boolean;
}

export interface HighlighterOptions extends WalkOptions {
  strategy?: RenderStrategy;
  /**
   * Highlight name used for matches that no state selects. Becomes
   * `::highlight(<name>)` under the `css` renderer. Defaults to `'match'`.
   */
  name?: string;
  /** Overlap resolution for the shared pipeline. Defaults to `'merge'`. */
  overlapStrategy?: OverlapStrategy;
  /** Class applied to every `<mark>` under the `mark` renderer. Defaults to `'omh-match'`. */
  markClassName?: string;
  /** Tag injected by the `mark` renderer. Defaults to `'mark'`. */
  markTag?: string;
}

export interface MarkOptions {
  states?: ReadonlyArray<HighlightState<SearchMatchContext>>;
  caseSensitive?: boolean;
  autoEscape?: boolean;
  sanitize?: (text: string) => string;
}

/** A resolved Range endpoint inside the walked subtree. */
export interface DomPoint {
  node: Text;
  offset: number;
}

export type { Segment, HighlightRange, OverlapStrategy };
