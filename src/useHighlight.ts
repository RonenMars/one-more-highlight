import { useMemo, useRef } from 'react';
import { applyStates } from './applyStates.js';
import { combineChunks } from './combineChunks.js';
import type { CombinedChunk } from './combineChunks.js';
import { buildSegments } from './buildSegments.js';
import { defaultFindChunks } from './findMatches.js';
import type { HighlightState, Segment, UseHighlightOptions, UseHighlightResult } from './types.js';

function searchKeyOf(searchWords: ReadonlyArray<string | RegExp>): string {
  return searchWords
    .map((w) => (typeof w === 'string' ? `s:${w}` : `r:${w.source}/${w.flags}`))
    .join('|');
}

function statesKeyOf(states: ReadonlyArray<HighlightState> | undefined): string {
  if (!states) return '';
  return JSON.stringify(states.map((s) => {
    let sel: unknown;
    if ('index' in s) sel = { i: s.index };
    else if ('range' in s) sel = { r: s.range };
    else if ('indices' in s) sel = { m: s.indices };
    else if ('nth' in s) sel = { t: s.term, n: s.nth, tm: s.termMatch ?? 'all', sl: !!s.silent };
    else sel = { t: s.term, tm: s.termMatch ?? 'all', sl: !!s.silent };
    return [s.name, sel, s.className ?? '', s.style ?? null];
  }));
}

export function useHighlight(opts: UseHighlightOptions): UseHighlightResult {
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

  // Track RegExp object identities across renders to warn when a new RegExp
  // instance is created inline each render (same source/flags, different object).
  const prevRegexes = useRef<Map<string, WeakRef<RegExp>>>(new Map());
  if (process.env.NODE_ENV !== 'production') {
    const next = new Map<string, WeakRef<RegExp>>();
    for (const w of searchWords) {
      if (w instanceof RegExp) {
        const key = `${w.source}/${w.flags}`;
        const prev = prevRegexes.current.get(key)?.deref();
        if (prev !== undefined && prev !== w) {
          console.warn(
            `[one-more-highlight] A new RegExp instance was passed for /${w.source}/${w.flags} on every render. ` +
            'Move it outside the component or wrap it in useMemo to avoid unnecessary re-matching.',
          );
        }
        next.set(key, new WeakRef(w));
      }
    }
    prevRegexes.current = next;
  }

  const searchKey = searchKeyOf(searchWords);
  const stKey = statesKeyOf(states);

  // Match geometry does not depend on states, so a states-only change must not
  // rerun the matcher — only the decoration memo below.
  const combined = useMemo<CombinedChunk[]>(() => {
    const finder = findChunks ?? defaultFindChunks;
    const raw = finder({
      searchWords,
      textToHighlight: text,
      caseSensitive,
      autoEscape,
      sanitize,
    });
    return combineChunks(raw, overlapStrategy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, searchKey, caseSensitive, autoEscape, sanitize, findChunks, overlapStrategy]);

  const segments = useMemo<Segment[]>(() => {
    const tagged = applyStates(combined, states, searchWords);
    return buildSegments(text, tagged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined, stKey, text, searchKey]);

  const getMatchCount = useMemo(
    () => () => segments.filter((s) => s.isMatch).length,
    [segments],
  );

  return { segments, getMatchCount };
}
