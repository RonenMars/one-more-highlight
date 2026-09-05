import { Highlight } from 'one-more-highlight';
import React from 'react';

// Scenario: a support-search box answering "how do I cancel my subscription
// and get money back". A semantic search backend returned the passages it
// considered relevant, as offsets plus a relevance score. None of these spans
// contains the words the user typed — no `searchWords` value could produce
// them — so the offsets are the only thing there is to render. `ranges` takes
// them verbatim and the built-in matcher never runs.
const text =
  'You can end your plan at any time from Billing settings. ' +
  'We keep access open until the end of the current cycle, and no further ' +
  'charges are made after that. Refunds for partial months are handled ' +
  'case by case by the support team.';

// Shaped like a search response: opaque ids, offsets, and per-hit metadata.
const hits = [
  { id: 'h1', start: 8, end: 33, termId: 'cancel', metadata: { score: 0.94 } },
  { id: 'h2', start: 39, end: 55, termId: 'cancel', metadata: { score: 0.88 } },
  { id: 'h3', start: 117, end: 155, termId: 'cancel', metadata: { score: 0.71 } },
  { id: 'h4', start: 157, end: 183, termId: 'refund', metadata: { score: 0.62 } },
];

const containerStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  background: 'var(--surface)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  lineHeight: 1.8,
};

export function RangesDemo() {
  return (
    <div className="live-demo" style={containerStyle}>
      <Highlight
        text={text}
        ranges={hits}
        highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
        states={[
          {
            name: 'strong',
            match: (m) => Number(m.range.metadata?.['score']) >= 0.85,
            style: { background: 'var(--hl-green)', color: 'var(--hl-text)' },
          },
          {
            name: 'refund',
            term: 'refund',
            style: { background: 'var(--hl-pink)', color: 'var(--hl-text)' },
          },
        ]}
      />
    </div>
  );
}
