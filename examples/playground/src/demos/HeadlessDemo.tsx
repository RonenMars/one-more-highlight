import { match, useHighlight } from 'one-more-highlight';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export function HeadlessDemo() {
  const { segments } = useHighlight({
    text,
    searchWords: ['time'],
    states: [{ name: 'active', ...match.one(2) }],
  });
  return (
    <p>
      {segments.map((s, i) =>
        s.isMatch ? (
          <mark key={i} data-states={s.states.join(' ')} className="hl-base">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
