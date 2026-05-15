import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

// Per-term colors via renderMatch: cat=yellow, catch=pink. With `merge`,
// overlapping `cat` + `catch` collapse into one band — termIndex of the
// surviving chunk is whichever match started first at that position.
export function OverlapMergeDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="merge"
      renderMatch={(seg, { Tag }) => (
        <Tag className={seg.termIndex === 1 ? 'hl-b' : 'hl-a'}>{seg.text}</Tag>
      )}
    />
  );
}
