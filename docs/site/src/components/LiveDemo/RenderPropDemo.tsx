import { Highlight, match } from 'one-more-highlight';
import React from 'react';

// Scenario: a documentation reader's "find on page" feature. Every hit on
// the search term "useEffect" gets a base highlight. The currently-focused
// hit (the one the user is "on") gets a gold ★ in the corner via renderMatch.
// Why renderMatch: the star is custom JSX that has to live INSIDE the <mark>
// element to anchor correctly. Plain className/style props can't render
// extra DOM nodes — renderMatch can.
const text =
  'A common React mistake: calling useEffect with no dependency array makes ' +
  'it run after every render. Wrap state-setting logic in useEffect carefully — ' +
  'an effect that updates state without a dependency check will trigger another ' +
  'render, which re-runs useEffect, which sets state again. Use the deps array. ' +
  'You can also reach for useEffect cleanup functions to undo subscriptions.';

const containerStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  background: 'var(--surface)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  lineHeight: 1.8,
};

export function RenderPropDemo() {
  return (
    <div style={containerStyle}>
      <Highlight
        text={text}
        searchWords={['useEffect']}
        highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
        states={[{ name: 'active', ...match.one(2), style: { background: 'var(--hl-green)', color: 'var(--hl-text)' } }]}
        renderMatch={(seg, { className, style, Tag }) => {
          const TagAny = Tag as 'mark';
          return (
            <TagAny className={className} style={style}>
              {seg.text}
              {seg.states.includes('active') && <sup style={{ color: 'var(--hl-amber)', WebkitTextStroke: '1px #000', paintOrder: 'stroke fill', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))' }}>★</sup>}
            </TagAny>
          );
        }}
      />
    </div>
  );
}
