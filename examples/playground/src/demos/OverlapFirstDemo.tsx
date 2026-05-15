import { Highlight } from 'one-more-highlight';

// Scenario: same article as the other overlap demos, same search for "Java"
// and "JavaScript". The order of searchWords becomes a priority list.
//
// first-wins: "Java" is listed FIRST, so it wins every overlap. The "Script"
// tail of "JavaScript" renders unhighlighted because "Java" already claimed
// the leading 4 characters and "JavaScript" was discarded for overlapping.
// Every surviving span is exactly 4 chars (yellow). Flip the array order
// to ['JavaScript', 'Java'] to see the reverse — "JavaScript" wins instead.
const text =
  'Java came first, then JavaScript was named after it for marketing reasons. ' +
  'Despite the name, Java and JavaScript are very different. Today JavaScript ' +
  'powers the web and Java powers backend services.';

export function OverlapFirstDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['Java', 'JavaScript']}
      overlapStrategy="first-wins"
      renderMatch={(seg, { Tag }) => (
        <Tag className={seg.end - seg.start > 4 ? 'hl-b' : 'hl-a'}>{seg.text}</Tag>
      )}
    />
  );
}
