import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import type {
  FindChunksInput,
  HighlightState as CoreHighlightState,
  HighlightStateMany as CoreHighlightStateMany,
  HighlightStateOne as CoreHighlightStateOne,
  HighlightStateRange as CoreHighlightStateRange,
  HighlightStateTerm as CoreHighlightStateTerm,
  HighlightStateTermNth as CoreHighlightStateTermNth,
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

/**
 * Swaps a core state's DOM styling surface (`className` / CSS `style`) for
 * the RN one. Distributes over the union, so a selector form added to the
 * core union in `src/types.ts` shows up here automatically.
 */
type WithNativeStyle<S> = S extends { name: string }
  ? Omit<S, 'className' | 'style'> & HighlightStateBase
  : never;

export type HighlightStateOne = WithNativeStyle<CoreHighlightStateOne>;
export type HighlightStateRange = WithNativeStyle<CoreHighlightStateRange>;
export type HighlightStateMany = WithNativeStyle<CoreHighlightStateMany>;
export type HighlightStateTerm = WithNativeStyle<CoreHighlightStateTerm>;
export type HighlightStateTermNth = WithNativeStyle<CoreHighlightStateTermNth>;

export type HighlightState = WithNativeStyle<CoreHighlightState>;

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
