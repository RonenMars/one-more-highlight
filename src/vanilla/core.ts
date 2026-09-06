import { applyStates } from '../applyStates.js';
import { buildSegments } from '../buildSegments.js';
import { combineChunks } from '../combineChunks.js';
import { defaultFindChunks } from '../findMatches.js';
import { chunksFromRanges } from '../fromRanges.js';
import type { HighlightState as CoreHighlightState, Segment } from '../types.js';
import type { HighlightOptions } from './types.js';

/**
 * The whole matching pipeline as one call: text in, alternating segments out.
 *
 * Identical semantics to `useHighlight`, minus React and minus the memoization
 * — a caller that needs caching owns the cache, because outside a component
 * there is no render to key it against.
 */
export function highlight(opts: HighlightOptions): Segment[] {
  const {
    text,
    searchWords,
    ranges,
    caseSensitive = false,
    autoEscape = true,
    sanitize,
    findChunks,
    states,
    overlapStrategy = 'merge',
  } = opts;

  const words = searchWords ?? [];
  const source = ranges
    ? chunksFromRanges(ranges, text.length)
    : {
        chunks: (findChunks ?? defaultFindChunks)({
          searchWords: words,
          textToHighlight: text,
          caseSensitive,
          autoEscape,
          sanitize,
        }),
        terms: words,
      };

  const combined = combineChunks(source.chunks, overlapStrategy);
  // The predicate in a state is typed against the context of the source it was
  // written for; `applyStates` builds exactly that context, a correlation the
  // checker can't see through the source union's two `states` shapes.
  const tagged = applyStates(
    combined,
    states as ReadonlyArray<CoreHighlightState> | undefined,
    source.terms,
    text,
  );
  return buildSegments(text, tagged);
}
