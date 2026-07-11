import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Text } from 'react-native';
import type {
  NativeSyntheticEvent,
  StyleProp,
  TextLayoutEventData,
  TextLayoutLine,
  TextStyle,
} from 'react-native';
import { useHighlight } from './useHighlight.js';
import { computeMatchLayouts } from './matchLayout.js';
import type { Segment } from '../types.js';
import type {
  HighlightLayoutHandle,
  HighlightState,
  HighlightTextProps,
  MeasuredMatch,
} from './types.js';

/**
 * Collect the per-state styles that select a given match, in the order the
 * states were declared (later states win, matching the web engine's cascade).
 */
function resolveStateStyles(
  matchStates: ReadonlyArray<string>,
  states: ReadonlyArray<HighlightState> | undefined,
): StyleProp<TextStyle>[] {
  if (!states) return [];
  const styles: StyleProp<TextStyle>[] = [];
  for (const s of states) {
    if (s.style && matchStates.includes(s.name)) styles.push(s.style);
  }
  return styles;
}

function renderText(
  seg: Segment,
  style: StyleProp<TextStyle> | undefined,
  key: string,
): React.ReactNode {
  // A run with no style is plain text; nesting a bare <Text> is unnecessary
  // and would introduce a distinct layout node, so return the string.
  if (!style) return seg.text;
  return (
    <Text key={key} style={style}>
      {seg.text}
    </Text>
  );
}

/**
 * React Native highlighter. Renders `text` inside a container `<Text>`, with
 * each match wrapped in a nested `<Text>` that carries the merged
 * highlight + per-state style.
 *
 * Unlike the DOM engine there is no `<mark>` element and no `role="mark"` —
 * RN's accessibility model has no `mark` role. For an accessible callout,
 * pass `accessibilityLabel` via `textProps` or use `renderMatch`.
 */
export const HighlightText = forwardRef<Text, HighlightTextProps>(
  function HighlightText(props, ref) {
    const {
      text,
      searchWords,
      caseSensitive,
      autoEscape,
      sanitize,
      findChunks,
      states,
      overlapStrategy,
      highlightStyle,
      unhighlightStyle,
      renderMatch,
      style,
      textProps,
      onMatchesLayout,
      layoutRef,
    } = props;

    // The container Text handle, needed both to satisfy the forwarded `ref`
    // (raw Text) and to drive `measureMatch`. `useImperativeHandle` on `ref`
    // would break consumers using the ref as a Text, so merge instead.
    const textRef = useRef<Text | null>(null);
    const setTextRef = useCallback(
      (node: Text | null) => {
        textRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const { segments } = useHighlight({
      text,
      searchWords,
      ...(caseSensitive !== undefined && { caseSensitive }),
      ...(autoEscape !== undefined && { autoEscape }),
      ...(sanitize !== undefined && { sanitize }),
      ...(findChunks !== undefined && { findChunks }),
      ...(states !== undefined && { states }),
      ...(overlapStrategy !== undefined && { overlapStrategy }),
    });

    // Last line boxes from onTextLayout. RN only fires onTextLayout when the
    // rendered layout changes, so when `searchWords` change but `text` doesn't,
    // the line boxes are identical and no event re-fires — we recompute from
    // this cache in an effect on segment change (below).
    const linesRef = useRef<ReadonlyArray<TextLayoutLine> | null>(null);
    const onMatchesLayoutRef = useRef(onMatchesLayout);
    onMatchesLayoutRef.current = onMatchesLayout;

    const emit = useCallback(() => {
      const lines = linesRef.current;
      if (!lines) return;
      onMatchesLayoutRef.current?.(computeMatchLayouts(segments, lines));
    }, [segments]);

    const userOnTextLayout = textProps?.onTextLayout;
    const handleTextLayout = useCallback(
      (e: NativeSyntheticEvent<TextLayoutEventData>) => {
        linesRef.current = e.nativeEvent.lines;
        userOnTextLayout?.(e);
        emit();
      },
      [userOnTextLayout, emit],
    );

    // Re-emit when segments change even if onTextLayout doesn't re-fire.
    useEffect(() => {
      emit();
    }, [emit]);

    useImperativeHandle(
      layoutRef,
      (): HighlightLayoutHandle => ({
        getMatchLayout: (matchIndex) => {
          const lines = linesRef.current;
          if (!lines) return null;
          return (
            computeMatchLayouts(segments, lines).find(
              (m) => m.matchIndex === matchIndex,
            ) ?? null
          );
        },
        measureMatch: (matchIndex, relativeTo) => {
          const lines = linesRef.current;
          const node = textRef.current;
          const layout = lines
            ? computeMatchLayouts(segments, lines).find(
                (m) => m.matchIndex === matchIndex,
              )
            : undefined;
          if (!layout || !node) return Promise.resolve(null);

          return new Promise<MeasuredMatch | null>((resolve) => {
            const finish = (x: number, y: number, width: number) =>
              resolve({ x, y: y + layout.y, width, height: layout.height });
            // A numeric handle or a ref to a measurable ancestor → measureLayout;
            // otherwise resolve against the window via measure.
            const target =
              typeof relativeTo === 'number'
                ? relativeTo
                : relativeTo?.current;
            if (target != null) {
              node.measureLayout(
                target as number,
                (x, y, width) => finish(x, y, width),
                () => resolve(null),
              );
            } else {
              node.measure((_x, _y, width, _h, pageX, pageY) =>
                finish(pageX, pageY, width),
              );
            }
          });
        },
      }),
      [segments],
    );

    const children = segments.map((seg, i) => {
      const key = `${seg.start}-${seg.end}-${i}`;

      if (!seg.isMatch) {
        return renderText(seg, unhighlightStyle, key);
      }

      const stateStyles = resolveStateStyles(seg.states, states);
      const mergedStyle: StyleProp<TextStyle> = [highlightStyle, ...stateStyles];

      if (renderMatch) {
        return (
          <Fragment key={key}>
            {renderMatch(seg, { style: mergedStyle })}
          </Fragment>
        );
      }

      return (
        <Text key={key} style={mergedStyle}>
          {seg.text}
        </Text>
      );
    });

    return (
      <Text
        {...textProps}
        ref={setTextRef}
        style={style}
        onTextLayout={handleTextLayout}
      >
        {children}
      </Text>
    );
  },
);
