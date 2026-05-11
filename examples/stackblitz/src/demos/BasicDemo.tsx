import { Highlight } from 'one-more-highlight';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export function BasicDemo() {
  return <Highlight text={text} searchWords={['time']} highlightClassName="hl-base" />;
}
