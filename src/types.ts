import type { CSSProperties, ComponentType, ElementType, JSX, ReactNode } from 'react';

export interface RawChunk {
  start: number;
  end: number;
  termIndex: number;
}

export interface MatchSegment {
  text: string;
  isMatch: true;
  matchIndex: number;
  start: number;
  end: number;
  states: ReadonlyArray<string>;
}

export interface TextSegment {
  text: string;
  isMatch: false;
  start: number;
  end: number;
}

export type Segment = MatchSegment | TextSegment;

export type HighlightStateBase = {
  name: string;
  className?: string;
  style?: CSSProperties;
};

export type HighlightStateOne = HighlightStateBase & { index: number };
export type HighlightStateRange = HighlightStateBase & { range: readonly [number, number] };
export type HighlightStateMany = HighlightStateBase & { indices: ReadonlyArray<number> };

export type HighlightState = HighlightStateOne | HighlightStateRange | HighlightStateMany;

export type OverlapStrategy = 'merge' | 'nest' | 'first-wins';

export interface FindChunksInput {
  searchWords: ReadonlyArray<string | RegExp>;
  textToHighlight: string;
  caseSensitive: boolean;
  autoEscape: boolean;
  sanitize?: ((text: string) => string) | undefined;
}

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

export interface HighlightProps extends UseHighlightOptions {
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
}
