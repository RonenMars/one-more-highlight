import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Highlight } from '../src/Highlight.js';

describe('<Highlight>', () => {
  it('renders text without matches as plain content', () => {
    render(<Highlight text="hello world" searchWords={['xyz']} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('wraps matches in <mark> by default', () => {
    const { container } = render(<Highlight text="hello world" searchWords={['world']} />);
    const mark = container.querySelector('mark');
    expect(mark).toHaveTextContent('world');
  });

  it('applies highlightClassName to all matches', () => {
    const { container } = render(
      <Highlight text="cat cat" searchWords={['cat']} highlightClassName="hl" />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    marks.forEach((m) => expect(m).toHaveClass('hl'));
  });

  it('applies state className on selected matches only', () => {
    const { container } = render(
      <Highlight
        text="cat cat cat"
        searchWords={['cat']}
        highlightClassName="base"
        states={[{ name: 'active', index: 1, className: 'active' }]}
      />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks[0]).toHaveClass('base');
    expect(marks[0]).not.toHaveClass('active');
    expect(marks[1]).toHaveClass('base', 'active');
    expect(marks[2]).not.toHaveClass('active');
  });

  it('composes multiple states on a single match', () => {
    const { container } = render(
      <Highlight
        text="cat cat cat"
        searchWords={['cat']}
        states={[
          { name: 'a', index: 0, className: 'a' },
          { name: 'b', range: [0, 1], className: 'b' },
          { name: 'c', indices: [0], className: 'c' },
        ]}
      />,
    );
    const first = container.querySelectorAll('mark')[0];
    expect(first).toHaveClass('a', 'b', 'c');
  });

  it('uses renderMatch when provided', () => {
    const { container } = render(
      <Highlight
        text="cat dog"
        searchWords={['cat', 'dog']}
        renderMatch={(seg) => <strong data-i={seg.matchIndex}>{seg.text}</strong>}
      />,
    );
    const strongs = container.querySelectorAll('strong');
    expect(strongs).toHaveLength(2);
    expect(strongs[0]).toHaveAttribute('data-i', '0');
    expect(strongs[1]).toHaveAttribute('data-i', '1');
  });

  it('adds role="mark" when overriding to non-semantic tag', () => {
    const { container } = render(
      <Highlight text="cat" searchWords={['cat']} highlightTag="span" />,
    );
    const span = container.querySelector('span[role="mark"]');
    expect(span).toHaveTextContent('cat');
  });

  it('passes matchIndex and states to custom component highlightTag', () => {
    const Custom = ({ children, matchIndex, states }: { children: React.ReactNode; matchIndex: number; states: ReadonlyArray<string> }) => (
      <em data-i={matchIndex} data-s={states.join(',')}>{children}</em>
    );
    const { container } = render(
      <Highlight
        text="cat cat"
        searchWords={['cat']}
        highlightTag={Custom}
        states={[{ name: 'active', index: 0 }]}
      />,
    );
    const ems = container.querySelectorAll('em');
    expect(ems[0]).toHaveAttribute('data-i', '0');
    expect(ems[0]).toHaveAttribute('data-s', 'active');
    expect(ems[1]).toHaveAttribute('data-s', '');
  });

  it('applies term-based state class to matches of the right search word', () => {
    const { container } = render(
      <Highlight
        text="cat dog cat"
        searchWords={['cat', 'dog']}
        highlightClassName="hl-base"
        states={[
          { name: 'feline', term: 'cat', className: 'hl-cat' },
          { name: 'canine', term: 'dog', className: 'hl-dog' },
        ]}
      />,
    );
    const marks = container.querySelectorAll('mark');
    // Three matches: 'cat', 'dog', 'cat'.
    expect(marks).toHaveLength(3);
    expect(marks[0]?.className).toContain('hl-cat');
    expect(marks[1]?.className).toContain('hl-dog');
    expect(marks[2]?.className).toContain('hl-cat');
  });

  it('applies nth state class only to the targeted occurrence', () => {
    const { container } = render(
      <Highlight
        text="cat dog cat dog cat"
        searchWords={['cat', 'dog']}
        highlightClassName="hl-base"
        states={[{ name: 'first-cat', term: 'cat', nth: 0, className: 'hl-first' }]}
      />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(5);
    expect(marks[0]?.className).toContain('hl-first');
    expect(marks[2]?.className).not.toContain('hl-first');
    expect(marks[4]?.className).not.toContain('hl-first');
  });
});
