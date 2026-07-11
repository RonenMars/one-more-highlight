import { Fragment, forwardRef } from 'react';
import { Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { useHighlight } from './useHighlight.js';
import type { Segment } from '../types.js';
import type { HighlightState, HighlightTextProps } from './types.js';

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
    } = props;

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
      <Text {...textProps} ref={ref} style={style}>
        {children}
      </Text>
    );
  },
);
