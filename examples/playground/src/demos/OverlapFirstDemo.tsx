import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

export function OverlapFirstDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="first-wins"
      highlightClassName="hl-base"
    />
  );
}
