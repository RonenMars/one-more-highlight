import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import type {
  FindChunksInput,
  MatchSegment,
  OverlapStrategy,
  RawChunk,
  Segment,
} from '../types.js';

/**
 * React Native flavor of {@link HighlightState}.
 *
 * The selector fields (`index` / `range` / `indices` / `term` / `nth`) are
 * identical to the web package — they drive the shared matching pipeline. The
 * styling surface differs: RN has no `className`, and `style` is a
 * `StyleProp<TextStyle>` rather than a DOM `CSSProperties`.
 */
export type HighlightStateBase = {
  name: string;
  style?: StyleProp<TextStyle>;
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

export type HighlightState =
  | HighlightStateOne
  | HighlightStateRange
  | HighlightStateMany
  | HighlightStateTerm
  | HighlightStateTermNth;

/**
 * Options for the RN `useHighlight` hook. Mirrors the web hook one-to-one
 * except `states` carries the RN {@link HighlightState}.
 */
export interface UseHighlightOptions {
  text: string;
  searchWords: ReadonlyArray<string | RegExp>;
  caseSensitive?: boolean;
  autoEscape?: boolean;
  sanitize?: (text: string) => string;
  findChunks?: (input: FindChunksInput) => ReadonlyArray<RawChunk>;
  states?: ReadonlyArray<HighlightState>;
  overlapStrategy?: OverlapStrategy;
}

export interface UseHighlightResult {
  segments: ReadonlyArray<Segment>;
  getMatchCount: () => number;
}

/**
 * Defaults handed to a custom `renderMatch`. `style` is the merged
 * highlight + per-state style; there is no `className` or `Tag` on RN —
 * matches always render inside a nested `<Text>`.
 */
export interface MatchDefaults {
  style: StyleProp<TextStyle>;
}

export interface HighlightTextProps extends UseHighlightOptions {
  /** Style applied to every match's nested `<Text>`. */
  highlightStyle?: StyleProp<TextStyle>;
  /** Style applied to non-match text runs (rarely needed). */
  unhighlightStyle?: StyleProp<TextStyle>;
  /**
   * Render prop for full control over a match. Receives the segment and the
   * merged default style. Return any `ReactNode`; it is rendered inline.
   */
  renderMatch?: (segment: MatchSegment, defaults: MatchDefaults) => ReactNode;
  /** Style applied to the outer container `<Text>`. */
  style?: StyleProp<TextStyle>;
  /**
   * Props forwarded to the outer container `<Text>` (e.g. `numberOfLines`,
   * `onPress`, `accessibilityRole`). `style` here is overridden by the
   * `style` prop above.
   */
  textProps?: Omit<TextProps, 'style' | 'children'>;
}
