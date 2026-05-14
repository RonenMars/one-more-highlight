import { Highlight, match } from 'one-more-highlight';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export function RenderPropDemo() {
  return (
    <Highlight
      text={text}
      searchWords={['time']}
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
