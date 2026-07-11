import type { TextLayoutLine } from 'react-native';
import type { Segment } from '../types.js';

/**
 * Layout of a single match inside the rendered root `<Text>`.
 *
 * `y` / `height` are the box of the **first line** the match falls on,
 * measured relative to the top of the root `<Text>` — not per-character and
 * not absolute-to-window (which would go stale on every scroll frame). RN
 * exposes no substring measurement, so the containing line is the finest
 * primitive available.
 */
export interface MatchLayout {
  matchIndex: number;
  termIndex: number;
  start: number;
  end: number;
  lineIndex: number;
  y: number;
  height: number;
}

/**
 * Map a 0-based char offset to the index of the reported line containing it.
 *
 * `onTextLayout` reports each line's `text`; we accumulate their lengths to
 * find the line whose char range covers `offset`. Some platforms drop trailing
 * whitespace from a line's reported `text`, so the accumulated total can fall
 * short of the real character count — when `offset` overruns every line we fall
 * back to the last line rather than returning nothing.
 *
 * Returns -1 only when there are no lines to map into.
 */
export function charToLine(
  lines: ReadonlyArray<TextLayoutLine>,
  offset: number,
): number {
  if (lines.length === 0) return -1;
  let consumed = 0;
  for (let i = 0; i < lines.length; i++) {
    consumed += lines[i]!.text.length;
    // `<` (not `<=`): an offset landing exactly on the boundary belongs to the
    // next line's first character, matching how the match's `start` is defined.
    if (offset < consumed) return i;
  }
  // Offset overran the reported text (trailing whitespace dropped, or the match
  // sits on a truncated/last line) — report the last line.
  return lines.length - 1;
}

/**
 * Compute the layout of every match from the cached line boxes and the current
 * segments. A match that wraps across lines reports its first line. Matches
 * whose start offset maps past the rendered lines (e.g. under `numberOfLines`
 * truncation) still resolve to the last rendered line via `charToLine`'s
 * fallback; callers that want to hide truncated matches can filter on `end`.
 */
export function computeMatchLayouts(
  segments: ReadonlyArray<Segment>,
  lines: ReadonlyArray<TextLayoutLine>,
): MatchLayout[] {
  if (lines.length === 0) return [];
  const out: MatchLayout[] = [];
  for (const seg of segments) {
    if (!seg.isMatch) continue;
    const lineIndex = charToLine(lines, seg.start);
    const line = lines[lineIndex]!;
    out.push({
      matchIndex: seg.matchIndex,
      termIndex: seg.termIndex,
      start: seg.start,
      end: seg.end,
      lineIndex,
      y: line.y,
      height: line.height,
    });
  }
  return out;
}
