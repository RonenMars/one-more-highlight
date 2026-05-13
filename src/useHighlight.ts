import { useMemo, useRef } from 'react';
import { applyStates } from './applyStates.js';
import { combineChunks } from './combineChunks.js';
import { buildSegments } from './buildSegments.js';
import { defaultFindChunks } from './findMatches.js';
import type { HighlightState, Segment, UseHighlightOptions, UseHighlightResult } from './types.js';

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
  if (isDev()) {
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

  const segments = useMemo<Segment[]>(() => {
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

  const getMatchCount = useMemo(
    () => () => segments.filter((s) => s.isMatch).length,
    [segments],
  );

  return { segments, getMatchCount };
}
