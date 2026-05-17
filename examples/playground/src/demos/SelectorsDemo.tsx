import { Highlight } from 'one-more-highlight';

// Scenario: a side-by-side reference of the three HighlightState selector forms.
// The text is intentionally repetitive (6 identical words) so each match
// index is visible at a glance. In real apps, the same selectors target:
//   • { index: n }       — "the user is currently on the nth hit" (find-in-page)
//   • { range: [lo, hi] } — "highlight a contiguous span of results" (a column of a table)
//   • { indices: [...] }  — "the user starred these specific hits" (bookmarks, multi-select)
const text = 'time time time time time time';

export function SelectorsDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ index: 2 } — index 2 only`}</small>
        <div>
          <Highlight text={text} searchWords={['time']} highlightClassName="hl-base"
            states={[{ name: 'one', index: 2, className: 'hl-one' }]} />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ range: [1, 3] } — indices 1–3`}</small>
        <div>
          <Highlight text={text} searchWords={['time']} highlightClassName="hl-base"
            states={[{ name: 'range', range: [1, 3], className: 'hl-range' }]} />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ indices: [0, 2, 4] } — indices 0, 2, 4`}</small>
        <div>
          <Highlight text={text} searchWords={['time']} highlightClassName="hl-base"
            states={[{ name: 'many', indices: [0, 2, 4], className: 'hl-many' }]} />
        </div>
      </div>
    </div>
  );
}
