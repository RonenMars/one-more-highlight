import { Highlight } from 'one-more-highlight';

// Scenario: a code-review tool searching for the word "test" but only when
// it appears as a whole word — not inside words like "latest", "testing",
// "contestant", or "untested". A plain string search would match all of
// those; the \btest\b regex with word boundaries skips them.
// Why this matters: searching codebases for "test" without anchors quickly
// returns dozens of false hits. The /i flag also makes it case-insensitive,
// so "Test" and "TEST" match too.
const text =
  'The latest test suite is passing, but the contestant said the untested ' +
  'edge case in the testing helper is the one that matters. We should add ' +
  'a Test for it before the release. Even a small TEST is better than nothing.';

export function RegexDemo() {
  return (
    <Highlight
      text={text}
      searchWords={[/\btest\b/i]}
      highlightClassName="hl-base"
    />
  );
}
