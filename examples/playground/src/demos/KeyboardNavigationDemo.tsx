import { useHighlight } from 'one-more-highlight';
import { MatchAnnouncer } from 'one-more-highlight/a11y';
import { useRovingMatchFocus } from 'one-more-highlight/navigation';

// Scenario: a Ctrl+F-style find-in-page UI where matches are keyboard
// navigable. Click a match (or Tab to it — only one is in the tab order at
// a time) then use arrow keys / Home / End to move between hits. The
// <MatchAnnouncer> live region reports position for screen reader users;
// sighted keyboard users see the roving outline move between matches.
const text =
  'A common React mistake: calling useEffect with no dependency array makes ' +
  'it run after every render. Use the deps array to control when useEffect ' +
  'fires, and return a cleanup function from useEffect to undo subscriptions.';

export function KeyboardNavigationDemo() {
  const { segments, getMatchCount, matchRef, getMatchNode, getMatchByIndex } = useHighlight({
    text,
    searchWords: ['useEffect'],
  });
  const matchCount = getMatchCount();
  const { activeIndex, getTabIndex, handleKeyDown } = useRovingMatchFocus({
    matchCount,
    getMatchNode,
  });
  const activeMatchText = getMatchByIndex(activeIndex)?.text;

  return (
    <div>
      <p style={{ marginBottom: '0.5rem', opacity: 0.7, fontSize: '0.85em' }}>
        Focus a match, then use arrow keys / Home / End to navigate.
      </p>
      <p>
        {segments.map((s, i) =>
          s.isMatch ? (
            <mark
              key={i}
              ref={matchRef(s.matchIndex)}
              tabIndex={getTabIndex(s.matchIndex)}
              onKeyDown={handleKeyDown}
              className="hl-base"
              style={{
                outline: s.matchIndex === activeIndex ? '2px solid var(--text)' : undefined,
              }}
            >
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
      <MatchAnnouncer
        matchCount={matchCount}
        activeIndex={activeIndex}
        {...(activeMatchText !== undefined && { activeMatchText })}
      />
    </div>
  );
}
