import type { CSSProperties, ComponentType, ElementType, JSX, ReactNode } from 'react';

export interface RawChunk {
  start: number;
  end: number;
  termIndex: number;
}

/**
 * A precomputed match supplied through `ranges`, bypassing the built-in
 * matcher. Offsets are code-unit indices into `text`, the same space
 * `MatchSegment.start` / `end` report.
 *
 * Not to be confused with {@link HighlightStateRange}, which selects a range
 * of *match indices* rather than a span of text.
 */
export interface HighlightRange {
  start: number;
  end: number;
  /** Opaque consumer identifier. Carried through untouched. */
  id?: string;
  /**
   * Groups ranges produced by the same query term. Distinct `termId`s are
   * numbered in first-appearance order to form `termIndex`, which is what
   * `{ term }` / `{ term, nth }` selectors resolve against.
   */
  termId?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface MatchSegment {
  text: string;
  isMatch: true;
  matchIndex: number;
  termIndex: number;
  start: number;
  end: number;
  states: ReadonlyArray<string>;
  /** The originating entry from `ranges`; absent under `searchWords`. */
  range?: HighlightRange | undefined;
}

export interface TextSegment {
  text: string;
  isMatch: false;
  start: number;
  end: number;
}

export type Segment = MatchSegment | TextSegment;

export interface MatchContextBase {
  /** This match's `matchIndex` — its ordinal in global document order. */
  index: number;
  /** The matched substring. */
  text: string;
  start: number;
  end: number;
  /** The full text being highlighted. */
  source: string;
  /** 0-based ordinal of this match among matches sharing its `termIndex`. */
  nthOfTerm: number;
}

/** Predicate context under a `searchWords` source. */
export interface SearchMatchContext extends MatchContextBase {
  /** The `searchWords` entry that produced this match. */
  term: string | RegExp;
  /** Index into `searchWords`. */
  termIndex: number;
  range?: undefined;
}

/** Predicate context under a `ranges` source. */
export interface RangeMatchContext extends MatchContextBase {
  /** The originating entry from `ranges`. */
  range: HighlightRange;
  /** The range's `termId`, or `undefined` when it has none. */
  term: string | undefined;
  /** Index of `term` among the distinct `termId`s, or `-1` when it has none. */
  termIndex: number;
}

export type MatchContext = SearchMatchContext | RangeMatchContext;

export type HighlightStateBase = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

export type HighlightStateOne = HighlightStateBase & { index: number };
export type HighlightStateRange = HighlightStateBase & { range: readonly [number, number] };
export type HighlightStateMany = HighlightStateBase & { indices: ReadonlyArray<number> };

export type HighlightStateTerm = HighlightStateBase & {
  term: string | number;
  termMatch?: 'all' | 'first';
  silent?: boolean;
};

export type HighlightStateTermNth = HighlightStateBase & {
  term: string | number;
  nth: number;
  termMatch?: 'all' | 'first';
  silent?: boolean;
};

export type HighlightStatePredicate<Ctx = MatchContext> = HighlightStateBase & {
  match: (context: Ctx) => boolean;
};

export type HighlightState<Ctx = MatchContext> =
  | HighlightStateOne
  | HighlightStateRange
  | HighlightStateMany
  | HighlightStateTerm
  | HighlightStateTermNth
  | HighlightStatePredicate<Ctx>;

export type OverlapStrategy = 'merge' | 'nest' | 'first-wins';

export interface FindChunksInput {
  searchWords: ReadonlyArray<string | RegExp>;
  textToHighlight: string;
  caseSensitive: boolean;
  autoEscape: boolean;
  sanitize?: ((text: string) => string) | undefined;
}

/** Options that configure the built-in matcher. Meaningless under `ranges`. */
export interface MatcherOptions {
  caseSensitive?: boolean;
  autoEscape?: boolean;
  sanitize?: (text: string) => string;
  findChunks?: (input: FindChunksInput) => ReadonlyArray<RawChunk>;
}

/**
 * The two mutually exclusive ways to feed the pipeline: run the built-in
 * matcher over `searchWords`, or supply already-computed `ranges`.
 *
 * `states` sits inside each branch so a predicate selector's context is typed
 * for the source actually in use — under `searchWords` every match has a term
 * and no range, under `ranges` the reverse.
 *
 * The absent members are `?: undefined` rather than `?: never`: under
 * `exactOptionalPropertyTypes` a `never` branch rejects an explicit
 * `ranges={undefined}`, which is how callers toggle between sources.
 */
export type HighlightSource<
  SearchStates = ReadonlyArray<HighlightState<SearchMatchContext>>,
  RangeStates = ReadonlyArray<HighlightState<RangeMatchContext>>,
> =
  | (MatcherOptions & {
      searchWords: ReadonlyArray<string | RegExp>;
      states?: SearchStates;
      ranges?: undefined;
    })
  | ({ [K in keyof MatcherOptions]?: undefined } & {
      ranges: ReadonlyArray<HighlightRange>;
      states?: RangeStates;
      searchWords?: undefined;
    });

export type UseHighlightOptions = {
  text: string;
  overlapStrategy?: OverlapStrategy;
} & HighlightSource;

export interface UseHighlightResult {
  segments: ReadonlyArray<Segment>;
  getMatchCount: () => number;
}

export interface HighlightTagProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  matchIndex: number;
  states: ReadonlyArray<string>;
}

export interface MatchDefaults {
  className: string;
  style: CSSProperties;
  Tag: ElementType;
}

export type HighlightProps = UseHighlightOptions & {
  highlightTag?: keyof JSX.IntrinsicElements | ComponentType<HighlightTagProps>;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
  unhighlightTag?: keyof JSX.IntrinsicElements;
  unhighlightClassName?: string;
  unhighlightStyle?: CSSProperties;
  renderMatch?: (segment: MatchSegment, defaults: MatchDefaults) => ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
};
