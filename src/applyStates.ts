import type { CombinedChunk } from './combineChunks.js';
import type { HighlightState } from './types.js';

function selects(state: HighlightState, matchIndex: number): boolean {
  if ('index' in state) return state.index === matchIndex;
  if ('range' in state) {
    const [lo, hi] = state.range;
    return matchIndex >= lo && matchIndex <= hi;
  }
  return state.indices.includes(matchIndex);
}

function highestSelected(state: HighlightState): number {
  if ('index' in state) return state.index;
  if ('range' in state) return state.range[1];
  return state.indices.length === 0 ? -1 : Math.max(...state.indices);
}

const warned = new WeakSet<ReadonlyArray<HighlightState>>();

function maybeWarnOutOfRange(
  states: ReadonlyArray<HighlightState>,
  matchCount: number,
): void {
  if (process.env.NODE_ENV === 'production' || warned.has(states)) return;
  for (const s of states) {
    if (highestSelected(s) >= matchCount) {
      console.warn(
        `[one-more-highlight] state "${s.name}" references match index >= ${matchCount} (out of range).`,
      );
      warned.add(states);
      return;
    }
  }
}

export interface TaggedChunk extends CombinedChunk {
  states: ReadonlyArray<string>;
}

export function applyStates(
  chunks: ReadonlyArray<CombinedChunk>,
  states: ReadonlyArray<HighlightState> | undefined,
): TaggedChunk[] {
  if (!states || states.length === 0) {
    return chunks.map((c) => ({ ...c, states: [] }));
  }
  maybeWarnOutOfRange(states, chunks.length);
  return chunks.map((c) => {
    const names: string[] = [];
    for (const s of states) {
      if (selects(s, c.matchIndex)) names.push(s.name);
    }
    return { ...c, states: names };
  });
}
