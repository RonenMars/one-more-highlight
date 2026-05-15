import { Highlight, match } from 'one-more-highlight';

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

export function MultiStateDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['error']}
      highlightClassName="hl-base"
      states={[
        { name: 'preview', ...match.range(0, 1), className: 'hl-preview' },
        { name: 'active', ...match.one(2), className: 'hl-active' },
        { name: 'bookmarked', ...match.many([3, 5]), className: 'hl-bookmark' },
      ]}
    />
  );
}
