import { Highlight } from 'one-more-highlight';
import React from 'react';

// Scenario: a search-results page where the user typed "React" into the
// search box. Every occurrence is highlighted with the same base style.
// This is the simplest <Highlight> use — one search term, one style.
const text =
  'React is a JavaScript library for building user interfaces. ' +
  'Most React apps use components, JSX, and the React hooks API. ' +
  'You can adopt React incrementally — even a single React component ' +
  'inside a legacy page is enough to feel the React rendering model.';

const style: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  background: 'var(--surface)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  lineHeight: 1.8,
};

const markStyle: React.CSSProperties = {
  background: 'var(--hl-yellow)',
  color: 'var(--hl-text)',
  padding: '0 2px',
  borderRadius: '2px',
};

export function BasicDemo() {
  return (
    <div style={style}>
      <Highlight
        text={text}
        searchWords={['React']}
        highlightStyle={markStyle}
      />
    </div>
  );
}
