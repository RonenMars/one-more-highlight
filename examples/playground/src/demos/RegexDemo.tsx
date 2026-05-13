import { Highlight } from 'one-more-highlight';

const text =
  'We need time. Not just any time — quality time. ' +
  'Overtime is not the same as prime time. Sometimes timing is everything.';

export function RegexDemo() {
  return (
    <Highlight
      text={text}
      searchWords={[/\btime\b/i]}
      highlightClassName="hl-base"
    />
  );
}
