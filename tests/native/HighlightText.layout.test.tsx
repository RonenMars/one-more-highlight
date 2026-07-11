import { createRef } from 'react';
import { render, screen, act } from '@testing-library/react-native';
import type { TextLayoutLine } from 'react-native';
import { HighlightText } from '../../src/native/HighlightText';
import type { HighlightLayoutHandle, MatchLayout } from '../../src/native';

function line(text: string, y: number, height = 10): TextLayoutLine {
  return {
    text, y, height, x: 0, width: text.length,
    ascender: 0, descender: 0, capHeight: 0, xHeight: 0,
  };
}

/** Fire a synthetic onTextLayout on the container Text carrying `lines`. */
function fireLayout(container: { props: { onTextLayout?: (e: unknown) => void } }, lines: TextLayoutLine[]) {
  act(() => {
    container.props.onTextLayout?.({ nativeEvent: { lines } });
  });
}

describe('<HighlightText> match layout', () => {
  it('emits match layouts on onTextLayout', () => {
    const onMatchesLayout = jest.fn<void, [ReadonlyArray<MatchLayout>]>();
    render(
      <HighlightText
        text="hello brown fox"
        searchWords={['fox']}
        onMatchesLayout={onMatchesLayout}
        textProps={{ accessibilityLabel: 'c' }}
      />,
    );
    const container = screen.getByLabelText('c');
    fireLayout(container, [line('hello brown ', 0), line('fox', 20)]);

    expect(onMatchesLayout).toHaveBeenCalled();
    const matches = onMatchesLayout.mock.calls.at(-1)![0];
    expect(matches).toEqual([
      { matchIndex: 0, termIndex: 0, start: 12, end: 15, lineIndex: 1, y: 20, height: 10 },
    ]);
  });

  it('re-emits with fresh offsets when searchWords change without a new layout event', () => {
    const onMatchesLayout = jest.fn<void, [ReadonlyArray<MatchLayout>]>();
    const { rerender } = render(
      <HighlightText
        text="hello brown fox"
        searchWords={['hello']}
        onMatchesLayout={onMatchesLayout}
        textProps={{ accessibilityLabel: 'c' }}
      />,
    );
    const container = screen.getByLabelText('c');
    fireLayout(container, [line('hello brown ', 0), line('fox', 20)]);
    expect(onMatchesLayout.mock.calls.at(-1)![0][0]!.matchIndex).toBe(0);
    expect(onMatchesLayout.mock.calls.at(-1)![0][0]!.start).toBe(0); // "hello"

    // Same text (layout identical → RN would NOT re-fire onTextLayout), new word.
    onMatchesLayout.mockClear();
    rerender(
      <HighlightText
        text="hello brown fox"
        searchWords={['fox']}
        onMatchesLayout={onMatchesLayout}
        textProps={{ accessibilityLabel: 'c' }}
      />,
    );
    // Effect recomputes from cached lines despite no onTextLayout event.
    expect(onMatchesLayout).toHaveBeenCalled();
    const m = onMatchesLayout.mock.calls.at(-1)![0];
    expect(m).toHaveLength(1);
    expect(m[0]!.start).toBe(12); // "fox"
  });

  it('emits [] when a re-match yields no matches', () => {
    const onMatchesLayout = jest.fn<void, [ReadonlyArray<MatchLayout>]>();
    const { rerender } = render(
      <HighlightText text="hello fox" searchWords={['fox']} onMatchesLayout={onMatchesLayout} textProps={{ accessibilityLabel: 'c' }} />,
    );
    fireLayout(screen.getByLabelText('c'), [line('hello fox', 0)]);
    onMatchesLayout.mockClear();
    rerender(
      <HighlightText text="hello fox" searchWords={['zzz']} onMatchesLayout={onMatchesLayout} textProps={{ accessibilityLabel: 'c' }} />,
    );
    expect(onMatchesLayout.mock.calls.at(-1)![0]).toEqual([]);
  });

  it('composes with a user-supplied onTextLayout handler', () => {
    const userHandler = jest.fn();
    const onMatchesLayout = jest.fn();
    render(
      <HighlightText
        text="a fox"
        searchWords={['fox']}
        onMatchesLayout={onMatchesLayout}
        textProps={{ accessibilityLabel: 'c', onTextLayout: userHandler }}
      />,
    );
    fireLayout(screen.getByLabelText('c'), [line('a fox', 0)]);
    expect(userHandler).toHaveBeenCalledTimes(1);
    expect(onMatchesLayout).toHaveBeenCalled();
  });

  it('getMatchLayout returns null before layout, then the cached layout', () => {
    const layoutRef = createRef<HighlightLayoutHandle>();
    render(
      <HighlightText text="hello fox" searchWords={['fox']} layoutRef={layoutRef} textProps={{ accessibilityLabel: 'c' }} />,
    );
    expect(layoutRef.current!.getMatchLayout(0)).toBeNull();
    fireLayout(screen.getByLabelText('c'), [line('hello fox', 0)]);
    expect(layoutRef.current!.getMatchLayout(0)).toMatchObject({ matchIndex: 0, y: 0, height: 10 });
    expect(layoutRef.current!.getMatchLayout(99)).toBeNull();
  });

  it('measureMatch resolves null for an unknown match and before layout', async () => {
    const layoutRef = createRef<HighlightLayoutHandle>();
    render(
      <HighlightText text="hello fox" searchWords={['fox']} layoutRef={layoutRef} textProps={{ accessibilityLabel: 'c' }} />,
    );
    await expect(layoutRef.current!.measureMatch(0)).resolves.toBeNull(); // before layout
    fireLayout(screen.getByLabelText('c'), [line('hello fox', 0)]);
    await expect(layoutRef.current!.measureMatch(99)).resolves.toBeNull(); // unknown index
  });

  it('measureMatch resolves null when relativeTo is passed but unattached', async () => {
    const layoutRef = createRef<HighlightLayoutHandle>();
    const unattached = createRef<import('react-native').View>(); // .current stays null
    render(
      <HighlightText text="hello fox" searchWords={['fox']} layoutRef={layoutRef} textProps={{ accessibilityLabel: 'c' }} />,
    );
    fireLayout(screen.getByLabelText('c'), [line('hello fox', 0)]);
    // A provided-but-null relativeTo must NOT silently fall back to window coords.
    await expect(layoutRef.current!.measureMatch(0, unattached)).resolves.toBeNull();
  });

  it('keeps the ref forwarding the raw Text handle', () => {
    const ref = createRef<import('react-native').Text>();
    render(<HighlightText text="hello fox" searchWords={['fox']} ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
