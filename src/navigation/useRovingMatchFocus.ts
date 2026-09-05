import { useCallback, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ScrollableMatchNode } from '../types.js';

export interface UseRovingMatchFocusOptions {
  /** Total number of matches, e.g. from `getMatchCount()`. */
  matchCount: number;
  /** Look up the DOM node for a match, e.g. `useHighlight()`'s `getMatchNode`. */
  getMatchNode: (matchIndex: number) => ScrollableMatchNode | null;
  /** Called after the active index changes, e.g. to drive a live-region announcement. */
  onActiveChange?: (matchIndex: number) => void;
}

export interface UseRovingMatchFocusResult {
  /** Index of the match currently in the tab order. */
  activeIndex: number;
  /** `0` for the active match, `-1` for every other — standard roving tabindex. */
  getTabIndex: (matchIndex: number) => 0 | -1;
  /** Attach to each match node's `onKeyDown`. Arrow keys move focus; Home/End jump to the ends. */
  handleKeyDown: (event: KeyboardEvent) => void;
  /** Imperatively move the roving focus (and DOM focus) to `matchIndex`. */
  focusMatch: (matchIndex: number) => void;
}

/**
 * Standard roving-tabindex pattern for keyboard-navigable matches: one match
 * is in the tab order at a time, and arrow keys move both the roving index
 * and DOM focus between matches. Depends on `useHighlight`'s node registry
 * (`getMatchNode`) for the underlying node access — matches must expose
 * `.focus()` (e.g. rendered with `tabIndex` via `getTabIndex`, which is
 * enough to make a `<mark>` focusable).
 */
export function useRovingMatchFocus(
  options: UseRovingMatchFocusOptions,
): UseRovingMatchFocusResult {
  const { matchCount, getMatchNode, onActiveChange } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const focusMatch = useCallback(
    (matchIndex: number) => {
      if (matchCount === 0) return;
      const clamped = Math.max(0, Math.min(matchIndex, matchCount - 1));
      setActiveIndex(clamped);
      onActiveChange?.(clamped);
      getMatchNode(clamped)?.focus?.();
    },
    [matchCount, getMatchNode, onActiveChange],
  );

  const getTabIndex = useCallback(
    (matchIndex: number): 0 | -1 => (matchIndex === activeIndex ? 0 : -1),
    [activeIndex],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (matchCount === 0) return;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          focusMatch((activeIndex + 1) % matchCount);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          focusMatch((activeIndex - 1 + matchCount) % matchCount);
          break;
        case 'Home':
          event.preventDefault();
          focusMatch(0);
          break;
        case 'End':
          event.preventDefault();
          focusMatch(matchCount - 1);
          break;
        default:
          break;
      }
    },
    [matchCount, activeIndex, focusMatch],
  );

  return { activeIndex, getTabIndex, handleKeyDown, focusMatch };
}
