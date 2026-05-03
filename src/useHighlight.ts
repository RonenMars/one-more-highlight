import { useMemo, useRef } from 'react';
import { applyStates } from './applyStates.js';
import { combineChunks } from './combineChunks.js';
import { buildSegments } from './buildSegments.js';
import { defaultFindChunks } from './findMatches.js';
import type { HighlightState, Segment, UseHighlightOptions } from './types.js';

const isDev = (): boolean =>
  typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

function searchKeyOf(searchWords: ReadonlyArray<string | RegExp>): string {
  return searchWords
    .map((w) => (typeof w === 'string' ? `s:${w}` : `r:${w.source}/${w.flags}`))
    .join('|');
}

function statesKeyOf(states: ReadonlyArray<HighlightState> | undefined): string {
  if (!states) return '';
  return JSON.stringify(states.map((s) => {
    const sel = 'index' in s
      ? { i: s.index }
      : 'range' in s
        ? { r: s.range }
        : { m: s.indices };
    return [s.name, sel, s.className ?? '', s.style ?? null];
  }));
}

export function useHighlight(opts: UseHighlightOptions): ReadonlyArray<Segment> {
  const {
    text,
    searchWords,
    caseSensitive = false,
    autoEscape = true,
    sanitize,
    findChunks,
    states,
    overlapStrategy = 'merge',
  } = opts;

  const lastRegexIdentities = useRef<WeakMap<RegExp, number>>(new WeakMap());
  if (isDev()) {
    let identityChanged = 0;
    for (const w of searchWords) {
      if (w instanceof RegExp) {
        const seen = lastRegexIdentities.current.get(w);
        if (seen === undefined) lastRegexIdentities.current.set(w, 1);
        else identityChanged++;
      }
    }
    void identityChanged;
  }

  const searchKey = searchKeyOf(searchWords);
  const stKey = statesKeyOf(states);

  return useMemo<Segment[]>(() => {
    const finder = findChunks ?? defaultFindChunks;
    const raw = finder({
      searchWords,
      textToHighlight: text,
      caseSensitive,
      autoEscape,
      sanitize,
    });
    const combined = combineChunks(raw, overlapStrategy);
    const tagged = applyStates(combined, states);
    return buildSegments(text, tagged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, searchKey, caseSensitive, autoEscape, sanitize, findChunks, stKey, overlapStrategy]);
}
