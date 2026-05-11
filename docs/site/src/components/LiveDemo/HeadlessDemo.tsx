import { match, useHighlight } from 'one-more-highlight';
import React from 'react';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

const containerStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#fafafa',
  borderRadius: '8px',
  border: '1px solid #eee',
  lineHeight: 1.6,
};

export function HeadlessDemo() {
  const segments = useHighlight({
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
                background: s.states.includes('active') ? '#fb923c' : '#fef9c3',
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
