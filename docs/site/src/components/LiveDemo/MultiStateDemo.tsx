import { Highlight, match } from 'one-more-highlight';
import React from 'react';

// Scenario: a Ctrl+F find-in-page UI scanning an error log for the word "error".
// The text has 6 matches. The user has cycled through them and bookmarked
// hits 3 and 5 (the real failures), deliberately skipping hit 4 — which is
// inside a warning line where "error" is only mentioned, not actually thrown.
// One <Highlight> renders four visual states in a single pass:
//   • base       — every "error" gets the yellow background
//   • preview    — hits 0–1, already-seen retries (faded pink)
//   • active     — hit 2, the one currently focused (green + outline)
//   • bookmarked — hits 3 and 5 marked for follow-up (underline); hit 4 skipped
const text =
  '[10:14:02] error: connection refused on port 5432 — retrying in 2s. ' +
  '[10:14:04] error: connection refused on port 5432 — retrying in 4s. ' +
  '[10:14:08] error: connection refused on port 5432 — retrying in 8s. ' +
  '[10:14:16] error: handshake failed after 3 retries. ' +
  '[10:14:16] warning: pool exhausted, no error logged this cycle. ' +
  '[10:14:30] error: timeout exceeded, giving up.';

const containerStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  background: 'var(--surface)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  lineHeight: 1.8,
};

export function MultiStateDemo() {
  return (
    <div style={containerStyle}>
      <Highlight
        text={text}
        searchWords={['error']}
        highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
        states={[
          { name: 'preview', ...match.range(0, 1), style: { background: 'var(--hl-pink)', color: 'var(--hl-text)' } },
          { name: 'active', ...match.one(2), style: { background: 'var(--hl-green)', color: 'var(--hl-text)', outline: '2px solid var(--text)' } },
          { name: 'bookmarked', ...match.many([3, 5]), style: { textDecoration: 'underline', textDecorationColor: 'var(--hl-pink)', textDecorationThickness: '2px' } },
        ]}
      />
    </div>
  );
}
