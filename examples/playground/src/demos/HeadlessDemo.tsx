import { match, useHighlight } from 'one-more-highlight';

// Scenario: same find-in-page UI as MultiStateDemo, but instead of letting
// <Highlight> emit the DOM, we use the headless useHighlight hook and emit
// our own. The hook returns a Segment[] array; the consumer renders.
//
// Why headless: total control over the wrapping element. Want a <button>
// per match so clicking jumps to it? A <a href="#match-3"> for deep links?
// Custom data attributes for analytics? The hook gives you the structured
// segments and stays out of the rendering decision.
//
// In this demo: each match is a <button> (so it could be focusable / clickable
// in a real app), and the "active" match gets aria-current="true" instead of
// a different className. Non-match segments are plain text.
const text =
  'A common React mistake: calling useEffect with no dependency array makes ' +
  'it run after every render. Use the deps array to control when useEffect ' +
  'fires, and return a cleanup function from useEffect to undo subscriptions.';

export function HeadlessDemo() {
  const { segments, getMatchCount } = useHighlight({
    text,
    searchWords: ['useEffect'],
    states: [{ name: 'active', ...match.one(1) }],
  });
  return (
    <div>
      <p style={{ marginBottom: '0.5rem', opacity: 0.7, fontSize: '0.85em' }}>
        {getMatchCount()} matches — middle one is the "current" hit
      </p>
      <p>
        {segments.map((s, i) =>
          s.isMatch ? (
            <button
              key={i}
              type="button"
              className="hl-base"
              aria-current={s.states.includes('active') ? 'true' : undefined}
              style={{
                font: 'inherit',
                border: 0,
                padding: '0 2px',
                cursor: 'pointer',
                background: s.states.includes('active') ? 'var(--hl-green)' : 'var(--hl-yellow)',
                color: 'var(--hl-text)',
                borderRadius: '2px',
              }}
            >
              {s.text}
            </button>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </div>
  );
}
