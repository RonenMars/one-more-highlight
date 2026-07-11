export { HighlightText } from './HighlightText.js';
export { useHighlight } from './useHighlight.js';

// Shared, platform-agnostic pipeline escape hatch (identical to the web export).
export { defaultFindChunks } from '../findMatches.js';

export type {
  HighlightLayoutHandle,
  HighlightState,
  HighlightStateMany,
  HighlightStateOne,
  HighlightStateRange,
  HighlightStateTerm,
  HighlightStateTermNth,
  HighlightTextProps,
  MatchDefaults,
  MeasuredMatch,
  UseHighlightOptions,
  UseHighlightResult,
} from './types.js';

export type { MatchLayout } from './matchLayout.js';

// Platform-neutral types re-exported from the shared pipeline.
export type {
  FindChunksInput,
  MatchSegment,
  OverlapStrategy,
  RawChunk,
  Segment,
  TextSegment,
} from '../types.js';
