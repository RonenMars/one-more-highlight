import { Highlight, match, useHighlight } from 'one-more-highlight';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export function App() {
  return (
    <main>
      <h1>one-more-highlight · playground</h1>

      <h2>1. Basic — every "time" highlighted</h2>
      <div className="demo">
        <Highlight text={text} searchWords={['time']} highlightClassName="hl-base" />
      </div>

      <h2>2. Multi-state — base + active(2) + preview(0–1) + bookmarked(3,5)</h2>
      <div className="demo">
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
      </div>

      <h2>3. Render-prop — star next to the active match</h2>
      <div className="demo">
        <Highlight
          text={text}
          searchWords={['time']}
          highlightClassName="hl-base"
          states={[{ name: 'active', ...match.one(2), className: 'hl-active' }]}
          renderMatch={(seg, { className, style, Tag }) => {
            const TagAny = Tag as 'mark';
            return (
              <TagAny className={className} style={style}>
                {seg.text}
                {seg.states.includes('active') && <sup>★</sup>}
              </TagAny>
            );
          }}
        />
      </div>

      <h2>4. Headless hook — DIY rendering</h2>
      <div className="demo">
        <HeadlessDemo />
      </div>
    </main>
  );
}

function HeadlessDemo() {
  const segments = useHighlight({
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
