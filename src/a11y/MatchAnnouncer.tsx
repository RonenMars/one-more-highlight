import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { visuallyHiddenStyle } from './visuallyHidden.js';

export interface MatchAnnouncerProps {
  /** Total number of matches, e.g. from `getMatchCount()`. */
  matchCount: number;
  /** Zero-based index of the current match, or `null` if none is active. */
  activeIndex: number | null;
  /** Text of the active match, e.g. from `getMatchByIndex(activeIndex)?.text`. */
  activeMatchText?: string;
  /** Debounce before announcing, so rapid navigation doesn't spam the region. Defaults to 150ms. */
  debounceMs?: number;
}

/**
 * Debounced `role="status"` region announcing result count and navigation
 * position — a different problem from highlight semantics: even with a
 * perfect semantic bridge, a keyboard user navigating results has no way to
 * know where they are without this.
 */
export function MatchAnnouncer(props: MatchAnnouncerProps): JSX.Element {
  const { matchCount, activeIndex, activeMatchText, debounceMs = 150 } = props;
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (matchCount === 0) {
        setMessage('No results');
        return;
      }
      const position =
        activeIndex !== null
          ? `Result ${activeIndex + 1} of ${matchCount}`
          : `${matchCount} result${matchCount === 1 ? '' : 's'}`;
      setMessage(activeMatchText ? `${position}. ${activeMatchText}` : position);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [matchCount, activeIndex, activeMatchText, debounceMs]);

  return (
    <div role="status" aria-live="polite" style={visuallyHiddenStyle}>
      {message}
    </div>
  );
}
