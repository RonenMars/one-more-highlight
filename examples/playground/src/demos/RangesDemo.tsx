import { Highlight } from 'one-more-highlight';
import type { RangeMatchContext } from 'one-more-highlight';

// Scenario: a support-search box answering "how do I cancel my subscription
// and get money back". A semantic search backend returned the passages it
// judged relevant, as offsets plus a relevance score. None of these spans
// contains the words the user typed, so no `searchWords` value could produce
// them — the offsets are the whole answer. `ranges` renders them verbatim and
// the built-in matcher never runs.
const text =
  'You can end your plan at any time from Billing settings. ' +
  'We keep access open until the end of the current cycle, and no further ' +
  'charges are made after that. Refunds for partial months are handled ' +
  'case by case by the support team.';

// Shaped like a search response: opaque ids, offsets, per-hit metadata.
const hits = [
  { id: 'h1', start: 8, end: 33, termId: 'cancel', metadata: { score: 0.94 } },
  { id: 'h2', start: 39, end: 55, termId: 'cancel', metadata: { score: 0.88 } },
  { id: 'h3', start: 117, end: 155, termId: 'cancel', metadata: { score: 0.71 } },
  { id: 'h4', start: 157, end: 183, termId: 'refund', metadata: { score: 0.62 } },
];

// Hoisted: predicates are keyed by identity, so an inline arrow would re-run
// the pipeline on every render.
const isStrongHit = (m: RangeMatchContext): boolean =>
  Number(m.range.metadata?.['score']) >= 0.85;

export function RangesDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <small style={{ opacity: 0.6 }}>{`ranges={[…]} — offsets from a search backend, no searchWords`}</small>
        <div>
          <Highlight text={text} ranges={hits} highlightClassName="hl-base" />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ match: (m) => m.range.metadata.score >= 0.85 } — styled by hit score`}</small>
        <div>
          <Highlight
            text={text}
            ranges={hits}
            highlightClassName="hl-base"
            states={[{ name: 'strong', match: isStrongHit, className: 'hl-one' }]}
          />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ term: 'refund' } — termId groups hits by query term`}</small>
        <div>
          <Highlight
            text={text}
            ranges={hits}
            highlightClassName="hl-base"
            states={[{ name: 'refund', term: 'refund', className: 'hl-many' }]}
          />
        </div>
      </div>
    </div>
  );
}
