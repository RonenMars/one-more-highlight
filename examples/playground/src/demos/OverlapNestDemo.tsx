import { Highlight } from 'one-more-highlight';

// Scenario: same article as OverlapMergeDemo, same search for "Java" and
// "JavaScript". The three overlap demos share this text and searchWords so
// you can directly compare what each strategy does.
//
// nest: every raw match survives, even when they overlap. Each "JavaScript"
// produces TWO segments side by side — a 4-char "Java" (yellow) followed by
// the longer "JavaScript" (pink). Standalone "Java" still renders yellow.
// Use this when you need every match individually addressable (e.g. for
// keyboard navigation or per-term styling).
const text =
  'Java came first, then JavaScript was named after it for marketing reasons. ' +
  'Despite the name, Java and JavaScript are very different. Today JavaScript ' +
  'powers the web and Java powers backend services.';

export function OverlapNestDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['Java', 'JavaScript']}
      overlapStrategy="nest"
      renderMatch={(seg, { Tag }) => (
        <Tag className={seg.end - seg.start > 4 ? 'hl-b' : 'hl-a'}>{seg.text}</Tag>
      )}
    />
  );
}
