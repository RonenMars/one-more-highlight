import { Highlight } from 'one-more-highlight';

// Scenario: a search-results page where the user typed "React" into the
// search box. Every occurrence is highlighted with the same base style.
// This is the simplest <Highlight> use — one search term, one style.
const text =
  'React is a JavaScript library for building user interfaces. ' +
  'Most React apps use components, JSX, and the React hooks API. ' +
  'You can adopt React incrementally — even a single React component ' +
  'inside a legacy page is enough to feel the React rendering model.';

export function BasicDemo() {
  return <Highlight text={text} searchWords={['React']} highlightClassName="hl-base" />;
}
