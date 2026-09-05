import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRovingMatchFocus } from '../src/navigation/useRovingMatchFocus.js';

const MATCH_COUNT = 3;

function RovingDemo() {
  const nodes = new Map<number, HTMLSpanElement>();
  const { getTabIndex, handleKeyDown, activeIndex } = useRovingMatchFocus({
    matchCount: MATCH_COUNT,
    getMatchNode: (i) => nodes.get(i) ?? null,
  });

  return (
    <div>
      <span data-testid="active-index">{activeIndex}</span>
      {Array.from({ length: MATCH_COUNT }, (_, i) => (
        <span
          key={i}
          data-testid={`match-${i}`}
          ref={(el) => {
            if (el) nodes.set(i, el);
          }}
          tabIndex={getTabIndex(i)}
          onKeyDown={handleKeyDown}
        >
          match {i}
        </span>
      ))}
    </div>
  );
}

describe('useRovingMatchFocus', () => {
  it('only the active match is in the tab order', () => {
    render(<RovingDemo />);
    expect(screen.getByTestId('match-0')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('match-1')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('match-2')).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowRight/ArrowDown move focus to the next match and wrap around', () => {
    render(<RovingDemo />);
    fireEvent.keyDown(screen.getByTestId('match-0'), { key: 'ArrowRight' });
    expect(screen.getByTestId('active-index')).toHaveTextContent('1');
    expect(document.activeElement).toBe(screen.getByTestId('match-1'));

    fireEvent.keyDown(screen.getByTestId('match-1'), { key: 'ArrowDown' });
    expect(screen.getByTestId('active-index')).toHaveTextContent('2');

    fireEvent.keyDown(screen.getByTestId('match-2'), { key: 'ArrowRight' });
    expect(screen.getByTestId('active-index')).toHaveTextContent('0');
  });

  it('ArrowLeft/ArrowUp move focus to the previous match and wrap around', () => {
    render(<RovingDemo />);
    fireEvent.keyDown(screen.getByTestId('match-0'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('active-index')).toHaveTextContent('2');
  });

  it('Home and End jump to the first and last match', () => {
    render(<RovingDemo />);
    fireEvent.keyDown(screen.getByTestId('match-0'), { key: 'End' });
    expect(screen.getByTestId('active-index')).toHaveTextContent('2');
    fireEvent.keyDown(screen.getByTestId('match-2'), { key: 'Home' });
    expect(screen.getByTestId('active-index')).toHaveTextContent('0');
  });
});
