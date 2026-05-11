import { Highlight } from 'one-more-highlight';
import React from 'react';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

const style: React.CSSProperties = {
  padding: '1rem',
  background: 'var(--ifm-background-surface-color)',
  borderRadius: '8px',
  border: '1px solid var(--ifm-color-emphasis-200)',
  lineHeight: 1.6,
};

const markStyle: React.CSSProperties = {
  background: '#FFEFA0',
  color: '#1b1b1d',
  padding: '0 2px',
  borderRadius: '2px',
};

export function BasicDemo() {
  return (
    <div style={style}>
      <Highlight
        text={text}
        searchWords={['time']}
        highlightStyle={markStyle}
      />
    </div>
  );
}
