import { useMemo, useRef } from 'react';
import { applyStates } from './applyStates.js';
import { combineChunks } from './combineChunks.js';
import { buildSegments } from './buildSegments.js';
import { chunksFromRanges } from './fromRanges.js';
import { defaultFindChunks } from './findMatches.js';
import type {
  HighlightState,
  MatchScrollOptions,
  MatchSegment,
  ScrollableMatchNode,
  Segment,
  UseHighlightOptions,
  UseHighlightResult,
} from './types.js';

// Serialized rather than joined: a term containing the delimiter would otherwise
// collide with a different array, and a colliding key skips re-matching entirely.
export function searchKeyOf(searchWords: ReadonlyArray<string | RegExp>): string {
  return JSON.stringify(
    searchWords.map((w) => (typeof w === 'string' ? `s:${w}` : `r:${w.source}/${w.flags}`)),
  );
}

// A predicate can't be compared structurally and the values it closes over are
// invisible from here, so key it by object identity: a hoisted (or memoized)
// predicate keeps the memo, a fresh inline one correctly busts it.
let nextPredicateId = 0;
const predicateIds = new WeakMap<object, number>();

function predicateIdOf(fn: object): number {
  let id = predicateIds.get(fn);
  if (id === undefined) {
    id = ++nextPredicateId;
    predicateIds.set(fn, id);
  }
  return id;
}

// `HighlightState<never>`: the key is built without ever calling a predicate,
// so it accepts a predicate written against any source's context.
function statesKeyOf(states: ReadonlyArray<HighlightState<never>> | undefined): string {
  if (!states) return '';
  return JSON.stringify(states.map((s) => {
    let sel: unknown;
    if ('index' in s) sel = { i: s.index };
    else if ('range' in s) sel = { r: s.range };
    else if ('indices' in s) sel = { m: s.indices };
    else if ('match' in s) sel = { p: predicateIdOf(s.match) };
    else if ('nth' in s) sel = { t: s.term, n: s.nth, tm: s.termMatch ?? 'all', sl: !!s.silent };
    else sel = { t: s.term, tm: s.termMatch ?? 'all', sl: !!s.silent };
    return [s.name, sel, s.className ?? '', s.style ?? null];
  }));
}

export function useHighlight(opts: UseHighlightOptions): UseHighlightResult {
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

  // Track RegExp object identities across renders to warn when a new RegExp
  // instance is created inline each render (same source/flags, different object).
  const prevRegexes = useRef<Map<string, WeakRef<RegExp>>>(new Map());
  if (process.env.NODE_ENV !== 'production') {
    const next = new Map<string, WeakRef<RegExp>>();
    for (const w of searchWords ?? []) {
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

  const searchKey = searchWords ? searchKeyOf(searchWords) : '';
  // `metadata` is opaque but predicates read it, so key on the whole entry.
  const rangesKey = ranges ? JSON.stringify(ranges) : '';
  const stKey = statesKeyOf(states);

  // Match geometry depends on the source, not on states, so a states-only
  // change must not rerun matching — only the decoration memo below.
  // `terms` travels with the chunks because `ranges` supplies its own, standing
  // in for `searchWords` so term-based selectors resolve under either source.
  const matched = useMemo(() => {
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
    return { combined: combineChunks(source.chunks, overlapStrategy), terms: source.terms };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, searchKey, rangesKey, caseSensitive, autoEscape, sanitize, findChunks, overlapStrategy]);

  const segments = useMemo<Segment[]>(() => {
    // A predicate is typed against the context of the source it was written
    // for, and `contextOf` builds exactly that context — a correlation the
    // checker can't see through the source union's two `states` shapes.
    const tagged = applyStates(
      matched.combined,
      states as ReadonlyArray<HighlightState> | undefined,
      matched.terms,
      text,
    );
    return buildSegments(text, tagged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, stKey, text, searchKey, rangesKey]);

  const getMatchCount = useMemo(
    () => () => segments.filter((s) => s.isMatch).length,
    [segments],
  );

  // Node registry: keyed by matchIndex, populated by the ref callbacks handed
  // to renderers. Ref callback identities are cached per matchIndex so nodes
  // aren't detached/reattached on every render (segments recompute only when
  // matching or state inputs actually change, see the memo above).
  const nodeRegistry = useRef(new Map<number, ScrollableMatchNode>());
  const refCache = useRef(new Map<number, (node: ScrollableMatchNode | null) => void>());
  const matchRef = useMemo(
    () => (matchIndex: number) => {
      let fn = refCache.current.get(matchIndex);
      if (!fn) {
        fn = (node) => {
          if (node) nodeRegistry.current.set(matchIndex, node);
          else nodeRegistry.current.delete(matchIndex);
        };
        refCache.current.set(matchIndex, fn);
      }
      return fn;
    },
    [],
  );
  const getMatchNode = useMemo(
    () => (matchIndex: number) => nodeRegistry.current.get(matchIndex) ?? null,
    [],
  );
  const scrollToMatch = useMemo(
    () => (matchIndex: number, options?: MatchScrollOptions) => {
      const node = nodeRegistry.current.get(matchIndex);
      if (!node) return false;
      node.scrollIntoView(options);
      return true;
    },
    [],
  );

  const matchesByIndex = useMemo(() => {
    const map = new Map<number, MatchSegment>();
    for (const s of segments) {
      if (s.isMatch) map.set(s.matchIndex, s);
    }
    return map;
  }, [segments]);
  const getMatchByIndex = useMemo(
    () => (matchIndex: number) => matchesByIndex.get(matchIndex),
    [matchesByIndex],
  );
  const getMatchAt = useMemo(
    () => (charPos: number) =>
      segments.find(
        (s): s is MatchSegment => s.isMatch && charPos >= s.start && charPos < s.end,
      ),
    [segments],
  );

  return {
    segments,
    getMatchCount,
    matchRef,
    getMatchNode,
    getMatchByIndex,
    getMatchAt,
    scrollToMatch,
  };
}
