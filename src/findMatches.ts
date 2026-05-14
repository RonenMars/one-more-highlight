import { escapeRegex } from './escapeRegex.js';
import type { FindChunksInput, RawChunk } from './types.js';

function ensureGlobal(re: RegExp): RegExp {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const safeFlags = flags.replace('y', '');
  if (process.env.NODE_ENV !== 'production' && re.flags.includes('y')) {
    console.warn('[one-more-highlight] sticky (y) regex flag is dropped; matching uses global semantics.');
  }
  return new RegExp(re.source, safeFlags);
}

function buildRegexForString(
  term: string,
  caseSensitive: boolean,
  autoEscape: boolean,
): RegExp | null {
  if (term.length === 0) return null;
  const source = autoEscape ? escapeRegex(term) : term;
  const flags = caseSensitive ? 'g' : 'gi';
  return new RegExp(source, flags);
}

function collectMatches(haystack: string, regex: RegExp, termIndex: number, out: RawChunk[]): void {
  for (const m of haystack.matchAll(regex)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (end > start) {
      out.push({ start, end, termIndex });
    }
  }
}

export function defaultFindChunks(input: FindChunksInput): ReadonlyArray<RawChunk> {
  const { searchWords, textToHighlight, caseSensitive, autoEscape, sanitize } = input;
  if (textToHighlight.length === 0 || searchWords.length === 0) return [];

  const haystack = sanitize ? sanitize(textToHighlight) : textToHighlight;
  const chunks: RawChunk[] = [];

  searchWords.forEach((term, termIndex) => {
    const regex =
      typeof term === 'string'
        ? buildRegexForString(term, caseSensitive, autoEscape)
        : ensureGlobal(term);
    if (!regex) return;
    collectMatches(haystack, regex, termIndex, chunks);
  });

  return chunks;
}
