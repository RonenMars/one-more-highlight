import type { CSSProperties } from 'react';

/**
 * Inline visually-hidden style (the standard clip-rect technique) — no CSS
 * file ships with this package, so `dual`/`annotated` modes and the
 * announcer region rely on inline styles rather than a consumer-supplied
 * class.
 */
export const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
