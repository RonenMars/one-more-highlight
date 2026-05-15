import type { TaggedChunk } from './applyStates.js';
import type { Segment } from './types.js';

export function buildSegments(
  text: string,
  chunks: ReadonlyArray<TaggedChunk>,
): Segment[] {
  if (chunks.length === 0) {
    if (text.length === 0) return [];
    return [{ text, isMatch: false, start: 0, end: text.length }];
  }

  const out: Segment[] = [];
  let cursor = 0;

  for (const c of chunks) {
    if (c.start > cursor) {
      out.push({
        text: text.slice(cursor, c.start),
        isMatch: false,
        start: cursor,
        end: c.start,
      });
    }
    out.push({
      text: text.slice(c.start, c.end),
      isMatch: true,
      matchIndex: c.matchIndex,
      termIndex: c.termIndex,
      start: c.start,
      end: c.end,
      states: c.states,
    });
    cursor = c.end;
  }

  if (cursor < text.length) {
    out.push({
      text: text.slice(cursor),
      isMatch: false,
      start: cursor,
      end: text.length,
    });
  }

  return out;
}
