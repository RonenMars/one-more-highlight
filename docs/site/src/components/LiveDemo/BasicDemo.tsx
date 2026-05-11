import { Highlight } from 'one-more-highlight';
import React from 'react';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

const style: React.CSSProperties = {
  padding: '1rem',
  background: '#fafafa',
  borderRadius: '8px',
  border: '1px solid #eee',
  lineHeight: 1.6,
};

const markStyle: React.CSSProperties = {
  background: '#fef9c3',
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
