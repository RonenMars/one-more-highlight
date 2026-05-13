import { Highlight } from 'one-more-highlight';

const text = 'The overlap between cat and catch is interesting — catfish too.';

export function OverlapNestDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['cat', 'catch']}
      overlapStrategy="nest"
      highlightClassName="hl-base"
    />
  );
}
