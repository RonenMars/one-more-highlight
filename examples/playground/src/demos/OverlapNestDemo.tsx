import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

// Per-term colors via renderMatch: cat=yellow, catch=pink. With `nest`,
// every raw chunk survives. The `cat` inside "catch" overlaps the `catch`
// match, so the three overlapping characters render with both colors
// layered (visually: a pink band with a yellow border where they intersect).
export function OverlapNestDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="nest"
      renderMatch={(seg, { Tag }) => (
        <Tag className={seg.termIndex === 1 ? 'hl-b' : 'hl-a'}>{seg.text}</Tag>
      )}
    />
  );
}
