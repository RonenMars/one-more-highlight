import { Highlight, match } from 'one-more-highlight';

// Scenario: a documentation reader's "find on page" feature. Every hit on
// the search term "useEffect" gets a base highlight. The currently-focused
// hit (the one the user is "on") gets a gold ★ in the corner via renderMatch.
// Why renderMatch: the star is custom JSX that has to live INSIDE the <mark>
// element to anchor correctly. Plain className/style props can't render
// extra DOM nodes — renderMatch can.
const text =
  'A common React mistake: calling useEffect with no dependency array makes ' +
  'it run after every render. Wrap state-setting logic in useEffect carefully — ' +
  'an effect that updates state without a dependency check will trigger another ' +
  'render, which re-runs useEffect, which sets state again. Use the deps array. ' +
  'You can also reach for useEffect cleanup functions to undo subscriptions.';

export function RenderPropDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['useEffect']}
      highlightClassName="hl-base"
      states={[{ name: 'active', ...match.one(2), className: 'hl-active' }]}
      renderMatch={(seg, { className, style, Tag }) => {
        const TagAny = Tag as 'mark';
        const isActive = seg.states.includes('active');
        return (
          <TagAny
            className={className}
            style={isActive ? { ...style, position: 'relative' } : style}
          >
            {seg.text}
            {isActive && (
              <span
                aria-hidden
                className="hl-star"
                style={{
                  position: 'absolute',
                  top: '-0.45em',
                  right: '-0.45em',
                  color: 'var(--hl-amber)',
                  fontSize: '0.8em',
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
              >
                ★
              </span>
            )}
          </TagAny>
        );
      }}
    />
  );
}
