import type { CombinedChunk } from './combineChunks.js';
import type {
  HighlightState,
  HighlightStateTerm,
  HighlightStateTermNth,
} from './types.js';

function selects(state: HighlightState, matchIndex: number): boolean {
  if ('index' in state) return state.index === matchIndex;
  if ('range' in state) {
    const [lo, hi] = state.range;
    return matchIndex >= lo && matchIndex <= hi;
  }
  if ('indices' in state) return state.indices.includes(matchIndex);
  return false;
}

function resolveTermIndices(
  state: HighlightStateTerm | HighlightStateTermNth,
  searchWords: ReadonlyArray<string | RegExp>,
): { indices: number[]; reason: 'ok' | 'unknown' } {
  if (typeof state.term === 'number') {
    if (state.term < 0 || state.term >= searchWords.length) {
      return { indices: [], reason: 'unknown' };
    }
    return { indices: [state.term], reason: 'ok' };
  }
  const matches = (w: string | RegExp): boolean => typeof w === 'string' && w === state.term;
  if (state.termMatch === 'first') {
    const i = searchWords.findIndex(matches);
    return i === -1 ? { indices: [], reason: 'unknown' } : { indices: [i], reason: 'ok' };
  }
  const all: number[] = [];
  searchWords.forEach((w, i) => {
    if (matches(w)) all.push(i);
  });
  return all.length === 0
    ? { indices: [], reason: 'unknown' }
    : { indices: all, reason: 'ok' };
}

function highestSelected(state: HighlightState): number {
  if ('index' in state) return state.index;
  if ('range' in state) return state.range[1];
  if ('indices' in state) {
    return state.indices.length === 0 ? -1 : Math.max(...state.indices);
  }
  return -1;
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

function maybeWarnUnknownTerm(
  state: HighlightStateTerm | HighlightStateTermNth,
  states: ReadonlyArray<HighlightState>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if ('silent' in state && state.silent) return;
  if (warned.has(states)) return;
  if (typeof state.term === 'number') {
    console.warn(
      `[one-more-highlight] state "${state.name}" references term index ${state.term} which is out of range of searchWords.`,
    );
  } else {
    console.warn(
      `[one-more-highlight] state "${state.name}" references term "${state.term}" which is not present in searchWords.`,
    );
  }
  warned.add(states);
}

function maybeWarnNthOutOfRange(
  state: HighlightStateTermNth,
  count: number,
  states: ReadonlyArray<HighlightState>,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if (state.silent) return;
  if (warned.has(states)) return;
  const termLabel =
    typeof state.term === 'number' ? `index ${state.term}` : `"${state.term}"`;
  console.warn(
    `[one-more-highlight] state "${state.name}" has nth: ${state.nth} but term ${termLabel} only has ${count} matches.`,
  );
  warned.add(states);
}

export interface TaggedChunk extends CombinedChunk {
  states: ReadonlyArray<string>;
}

export function applyStates(
  chunks: ReadonlyArray<CombinedChunk>,
  states: ReadonlyArray<HighlightState> | undefined,
  searchWords: ReadonlyArray<string | RegExp>,
): TaggedChunk[] {
  if (!states || states.length === 0) {
    return chunks.map((c) => ({ ...c, states: [] }));
  }
  maybeWarnOutOfRange(states, chunks.length);

  // Pre-pass: for each state that has a `term`, resolve to a set of matchIndices.
  // Term-based selectors must know which chunks to tag in document order, so
  // we precompute the set rather than recomputing inside the chunk loop.
  const termSelections = new Map<HighlightState, Set<number>>();
  for (const s of states) {
    if (!('term' in s)) continue;
    const resolved = resolveTermIndices(s, searchWords);
    if (resolved.reason === 'unknown') {
      maybeWarnUnknownTerm(s, states);
      termSelections.set(s, new Set());
      continue;
    }
    const termSet = new Set(resolved.indices);
    const candidates = chunks
      .filter((c) => termSet.has(c.termIndex))
      .slice()
      .sort((a, b) => a.start - b.start || a.end - b.end);
    if ('nth' in s) {
      if (s.nth < 0 || s.nth >= candidates.length) {
        maybeWarnNthOutOfRange(s, candidates.length, states);
        termSelections.set(s, new Set());
      } else {
        const picked = candidates[s.nth];
        termSelections.set(s, new Set(picked ? [picked.matchIndex] : []));
      }
    } else {
      termSelections.set(s, new Set(candidates.map((c) => c.matchIndex)));
    }
  }

  return chunks.map((c) => {
    const names: string[] = [];
    for (const s of states) {
      if ('term' in s) {
        if (termSelections.get(s)?.has(c.matchIndex)) names.push(s.name);
      } else if (selects(s, c.matchIndex)) {
        names.push(s.name);
      }
    }
    return { ...c, states: names };
  });
}
