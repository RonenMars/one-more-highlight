import { Highlight } from 'one-more-highlight';

// Scenario: a search across an article that mentions Java and JavaScript.
// The user searched for both "Java" and "JavaScript" — but "Java" is a
// substring of "JavaScript", so every "JavaScript" produces two overlapping
// raw matches. The three overlap demos (Merge/Nest/First) share this exact
// text and searchWords so you can compare strategies side by side.
//
// merge: overlapping matches collapse into one span the size of the longer
// match. Color by width here: pink for 10-char "JavaScript" spans, yellow
// for the standalone 4-char "Java" spans that don't overlap.
const text =
  'Java came first, then JavaScript was named after it for marketing reasons. ' +
  'Despite the name, Java and JavaScript are very different. Today JavaScript ' +
  'powers the web and Java powers backend services.';

export function OverlapMergeDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['Java', 'JavaScript']}
      overlapStrategy="merge"
      renderMatch={(seg, { Tag }) => (
        <Tag className={seg.end - seg.start > 4 ? 'hl-b' : 'hl-a'}>{seg.text}</Tag>
      )}
    />
  );
}
