import { Highlight, match } from 'one-more-highlight';
import React from 'react';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

const containerStyle: React.CSSProperties = {
  padding: '1rem',
  background: 'var(--ifm-background-surface-color)',
  borderRadius: '8px',
  border: '1px solid var(--ifm-color-emphasis-200)',
  lineHeight: 1.6,
};

export function MultiStateDemo() {
  return (
    <div style={containerStyle}>
      <Highlight
        text={text}
        searchWords={['time']}
        highlightStyle={{ background: '#fef9c3', padding: '0 2px', borderRadius: '2px' }}
        states={[
          { name: 'preview', ...match.range(0, 1), style: { background: '#bfdbfe' } },
          { name: 'active', ...match.one(2), style: { background: '#fb923c', color: 'white', outline: '2px solid #c2410c' } },
          { name: 'bookmarked', ...match.many([3, 5]), style: { textDecoration: 'underline', textDecorationColor: '#ec4899', textDecorationThickness: '2px' } },
        ]}
      />
    </div>
  );
}
