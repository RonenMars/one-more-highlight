import { match, useHighlight } from 'one-more-highlight';
import React from 'react';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

const containerStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  background: 'var(--ifm-background-surface-color)',
  borderRadius: '10px',
  border: '1px solid var(--ifm-color-emphasis-400)',
  boxShadow: '0 1px 2px rgba(15, 18, 30, 0.04), 0 6px 16px rgba(15, 18, 30, 0.05)',
  lineHeight: 1.6,
};

export function HeadlessDemo() {
  const { segments } = useHighlight({
    text,
    searchWords: ['time'],
    states: [{ name: 'active', ...match.one(2) }],
  });
  return (
    <div style={containerStyle}>
      <p style={{ margin: 0 }}>
        {segments.map((s, i) =>
          s.isMatch ? (
            <mark
              key={i}
              style={{
                background: s.states.includes('active') ? 'var(--hl-green)' : 'var(--hl-yellow)',
                color: 'var(--hl-text)',
                padding: '0 2px',
                borderRadius: '2px',
              }}
            >
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </div>
  );
}
