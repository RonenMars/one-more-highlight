import { Highlight, match } from 'one-more-highlight';
import React from 'react';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

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
        searchWords={['time']}
        highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
        states={[{ name: 'active', ...match.one(2), style: { background: 'var(--hl-green)', color: 'var(--hl-text)' } }]}
        renderMatch={(seg, { className, style, Tag }) => {
          const TagAny = Tag as 'mark';
          return (
            <TagAny className={className} style={style}>
              {seg.text}
              {seg.states.includes('active') && <sup style={{ color: 'var(--hl-amber)' }}>★</sup>}
            </TagAny>
          );
        }}
      />
    </div>
  );
}
