import { Highlight, match } from 'one-more-highlight';
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

export function MultiStateDemo() {
  return (
    <div style={containerStyle}>
      <Highlight
        text={text}
        searchWords={['time']}
        highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
        states={[
          { name: 'preview', ...match.range(0, 1), style: { background: 'var(--hl-pink)', color: 'var(--hl-text)' } },
          { name: 'active', ...match.one(2), style: { background: 'var(--hl-green)', color: 'var(--hl-text)', outline: '2px solid currentColor' } },
          { name: 'bookmarked', ...match.many([3, 5]), style: { textDecoration: 'underline', textDecorationColor: 'var(--hl-pink)', textDecorationThickness: '2px' } },
        ]}
      />
    </div>
  );
}
