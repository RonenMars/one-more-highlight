import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { HighlightText } from '../../src/native/HighlightText';

/** Flatten a possibly-nested RN style prop into one object for assertions. */
function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => ({ ...acc, ...flatten(s) }),
      {},
    );
  }
  return (style as Record<string, unknown>) ?? {};
}

describe('<HighlightText>', () => {
  it('renders text without matches as plain content', () => {
    render(<HighlightText text="hello world" searchWords={['xyz']} />);
    expect(screen.getByText('hello world')).toBeTruthy();
  });

  it('wraps each match in its own nested <Text>', () => {
    render(<HighlightText text="hello world" searchWords={['world']} />);
    // The match text is isolated in its own Text node.
    expect(screen.getByText('world')).toBeTruthy();
  });

  it('applies highlightStyle to all matches', () => {
    render(
      <HighlightText
        text="cat cat"
        searchWords={['cat']}
        highlightStyle={{ backgroundColor: 'yellow' }}
      />,
    );
    const matches = screen.getAllByText('cat');
    expect(matches).toHaveLength(2);
    matches.forEach((node) => {
      expect(flatten(node.props.style)).toMatchObject({ backgroundColor: 'yellow' });
    });
  });

  it('applies unhighlightStyle to non-match runs', () => {
    render(
      <HighlightText
        text="cat dog"
        searchWords={['dog']}
        unhighlightStyle={{ color: 'grey' }}
      />,
    );
    expect(flatten(screen.getByText('cat').props.style)).toMatchObject({
      color: 'grey',
    });
  });

  it('forwards matching options to the pipeline (caseSensitive)', () => {
    render(<HighlightText text="cat CAT cat" searchWords={['cat']} caseSensitive />);
    expect(screen.getAllByText('cat')).toHaveLength(2);
    expect(screen.queryByText('CAT')).toBeNull();
  });

  it('applies state style on selected matches only', () => {
    render(
      <HighlightText
        text="cat cat cat"
        searchWords={['cat']}
        highlightStyle={{ backgroundColor: 'base' }}
        states={[{ name: 'active', index: 1, style: { color: 'red' } }]}
      />,
    );
    const matches = screen.getAllByText('cat');
    expect(flatten(matches[0]!.props.style)).not.toMatchObject({ color: 'red' });
    expect(flatten(matches[1]!.props.style)).toMatchObject({
      backgroundColor: 'base',
      color: 'red',
    });
    expect(flatten(matches[2]!.props.style)).not.toMatchObject({ color: 'red' });
  });

  it('composes multiple states on a single match (later wins)', () => {
    render(
      <HighlightText
        text="cat cat cat"
        searchWords={['cat']}
        states={[
          { name: 'a', index: 0, style: { color: 'a', fontWeight: 'bold' } },
          { name: 'b', range: [0, 1], style: { color: 'b' } },
          { name: 'c', indices: [0], style: { fontSize: 20 } },
        ]}
      />,
    );
    const first = screen.getAllByText('cat')[0]!;
    // color: last matching state ('b') wins; unrelated keys accumulate.
    expect(flatten(first.props.style)).toMatchObject({
      color: 'b',
      fontWeight: 'bold',
      fontSize: 20,
    });
  });

  it('uses renderMatch when provided', () => {
    render(
      <HighlightText
        text="cat dog"
        searchWords={['cat', 'dog']}
        renderMatch={(seg) => (
          <Text accessibilityLabel={`match-${seg.matchIndex}`}>{seg.text}</Text>
        )}
      />,
    );
    expect(screen.getByLabelText('match-0')).toBeTruthy();
    expect(screen.getByLabelText('match-1')).toBeTruthy();
  });

  it('applies term-based state style to matches of the right search word', () => {
    render(
      <HighlightText
        text="cat dog cat"
        searchWords={['cat', 'dog']}
        states={[
          { name: 'feline', term: 'cat', style: { color: 'catcolor' } },
          { name: 'canine', term: 'dog', style: { color: 'dogcolor' } },
        ]}
      />,
    );
    expect(flatten(screen.getAllByText('cat')[0]!.props.style)).toMatchObject({
      color: 'catcolor',
    });
    expect(flatten(screen.getByText('dog').props.style)).toMatchObject({
      color: 'dogcolor',
    });
    expect(flatten(screen.getAllByText('cat')[1]!.props.style)).toMatchObject({
      color: 'catcolor',
    });
  });

  it('applies nth state style only to the targeted occurrence', () => {
    render(
      <HighlightText
        text="cat dog cat dog cat"
        searchWords={['cat', 'dog']}
        states={[{ name: 'first-cat', term: 'cat', nth: 0, style: { color: 'first' } }]}
      />,
    );
    const cats = screen.getAllByText('cat');
    expect(cats).toHaveLength(3);
    expect(flatten(cats[0]!.props.style)).toMatchObject({ color: 'first' });
    expect(flatten(cats[1]!.props.style)).not.toMatchObject({ color: 'first' });
    expect(flatten(cats[2]!.props.style)).not.toMatchObject({ color: 'first' });
  });

  it('forwards textProps to the container Text', () => {
    render(
      <HighlightText
        text="cat cat cat"
        searchWords={['cat']}
        textProps={{ numberOfLines: 1, accessibilityLabel: 'container' }}
      />,
    );
    const container = screen.getByLabelText('container');
    expect(container.props.numberOfLines).toBe(1);
  });
});
