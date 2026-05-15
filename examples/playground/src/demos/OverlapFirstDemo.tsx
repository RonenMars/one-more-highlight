import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

// Per-term colors via renderMatch: cat=yellow, catch=pink. With `first-wins`,
// the chunk that starts first (or, on tie, ends first) keeps the slot —
// `cat` at index 28 wins over `catch` at index 28, so the `ch` in "catch"
// renders unhighlighted.
export function OverlapFirstDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="first-wins"
      renderMatch={(seg, { Tag }) => (
        <Tag className={seg.termIndex === 1 ? 'hl-b' : 'hl-a'}>{seg.text}</Tag>
      )}
    />
  );
}
