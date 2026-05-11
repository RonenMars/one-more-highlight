import { Highlight, match } from 'one-more-highlight';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export function MultiStateDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['time']}
      highlightClassName="hl-base"
      states={[
        { name: 'preview', ...match.range(0, 1), className: 'hl-preview' },
        { name: 'active', ...match.one(2), className: 'hl-active' },
        { name: 'bookmarked', ...match.many([3, 5]), className: 'hl-bookmark' },
      ]}
    />
  );
}
