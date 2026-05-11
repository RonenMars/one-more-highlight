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
        highlightStyle={{ background: '#FFEFA0', color: '#1b1b1d', padding: '0 2px', borderRadius: '2px' }}
        states={[
          { name: 'preview', ...match.range(0, 1), style: { background: '#5EEAD4', color: '#1b1b1d' } },
          { name: 'active', ...match.one(2), style: { background: '#FF8FB5', color: '#1b1b1d', outline: '2px solid #cc3366' } },
          { name: 'bookmarked', ...match.many([3, 5]), style: { textDecoration: 'underline', textDecorationColor: '#FF8FB5', textDecorationThickness: '2px' } },
        ]}
      />
    </div>
  );
}
