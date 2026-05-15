import { match, useHighlight } from 'one-more-highlight';
import React from 'react';

// Scenario: a documentation reader where each "useEffect" match is rendered
// as a focusable <button> instead of a <mark>. In a real app, clicking the
// button could scroll the reader to that hit or open a side panel. The
// middle match is the "current" one, marked with aria-current="true".
//
// Why headless: <Highlight> emits <mark> elements. Here we need <button>
// elements with semantic attributes. useHighlight returns the structured
// segments and stays out of the rendering decision entirely.
const text =
  'A common React mistake: calling useEffect with no dependency array makes ' +
  'it run after every render. Use the deps array to control when useEffect ' +
  'fires, and return a cleanup function from useEffect to undo subscriptions.';

const containerStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  background: 'var(--surface)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  lineHeight: 1.8,
};

const matchBaseStyle: React.CSSProperties = {
  font: 'inherit',
  border: 0,
  padding: '0 2px',
  cursor: 'pointer',
  color: 'var(--hl-text)',
  borderRadius: '2px',
};

export function HeadlessDemo() {
  const { segments, getMatchCount } = useHighlight({
    text,
    searchWords: ['useEffect'],
    states: [{ name: 'active', ...match.one(1) }],
  });
  return (
    <div style={containerStyle}>
      <p style={{ margin: '0 0 0.5rem', opacity: 0.7, fontSize: '0.85em' }}>
        {getMatchCount()} matches — middle one is the "current" hit
      </p>
      <p style={{ margin: 0 }}>
        {segments.map((s, i) =>
          s.isMatch ? (
            <button
              key={i}
              type="button"
              aria-current={s.states.includes('active') ? 'true' : undefined}
              style={{
                ...matchBaseStyle,
                background: s.states.includes('active') ? 'var(--hl-green)' : 'var(--hl-yellow)',
              }}
            >
              {s.text}
            </button>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </div>
  );
}
