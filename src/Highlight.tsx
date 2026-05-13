import clsx from 'clsx';
import { Fragment, createElement, forwardRef } from 'react';
import type { CSSProperties, ElementRef, ReactNode } from 'react';
import { useHighlight } from './useHighlight.js';
import type {
  HighlightProps,
  HighlightState,
  MatchSegment,
  Segment,
} from './types.js';

const SEMANTIC_TAGS = new Set(['mark']);

function resolveStateStyles(
  matchStates: ReadonlyArray<string>,
  states: ReadonlyArray<HighlightState> | undefined,
): { classNames: string[]; styles: CSSProperties[] } {
  const classNames: string[] = [];
  const styles: CSSProperties[] = [];
  if (!states) return { classNames, styles };
  for (const s of states) {
    if (matchStates.includes(s.name)) {
      if (s.className) classNames.push(s.className);
      if (s.style) styles.push(s.style);
    }
  }
  return { classNames, styles };
}

function renderUnhighlight(
  seg: Segment,
  tag: HighlightProps['unhighlightTag'],
  className: string | undefined,
  style: CSSProperties | undefined,
  key: string,
): ReactNode {
  if (!tag && !className && !style) return seg.text;
  if (tag) {
    return createElement(tag, { key, className, style }, seg.text);
  }
  return createElement(Fragment, { key }, seg.text);
}

function renderMatchDefault(
  seg: MatchSegment,
  highlightTag: HighlightProps['highlightTag'],
  className: string,
  style: CSSProperties,
  key: string,
): ReactNode {
  const Tag = highlightTag ?? 'mark';
  const isCustomComponent = typeof Tag !== 'string';
  const isSemantic = typeof Tag === 'string' && SEMANTIC_TAGS.has(Tag);

  const props: Record<string, unknown> = {
    key,
    className: className || undefined,
    style: Object.keys(style).length > 0 ? style : undefined,
  };

  if (isCustomComponent) {
    props['matchIndex'] = seg.matchIndex;
    props['states'] = seg.states;
  } else if (!isSemantic) {
    props['role'] = 'mark';
  }

  return createElement(Tag as never, props, seg.text);
}

export const Highlight = forwardRef<
  ElementRef<'span'>,
  HighlightProps
>(function Highlight(props, ref) {
  const {
    text,
    searchWords,
    caseSensitive,
    autoEscape,
    sanitize,
    findChunks,
    states,
    overlapStrategy,
    highlightTag,
    highlightClassName,
    highlightStyle,
    unhighlightTag,
    unhighlightClassName,
    unhighlightStyle,
    renderMatch,
    as = 'span',
    className,
    style,
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
      return renderUnhighlight(seg, unhighlightTag, unhighlightClassName, unhighlightStyle, key);
    }

    const { classNames, styles } = resolveStateStyles(seg.states, states);
    const fullClassName = clsx(highlightClassName, ...classNames);
    const fullStyle: CSSProperties = Object.assign({}, highlightStyle, ...styles);

    if (renderMatch) {
      const Tag = highlightTag ?? 'mark';
      return (
        <Fragment key={key}>
          {renderMatch(seg, { className: fullClassName, style: fullStyle, Tag })}
        </Fragment>
      );
    }

    return renderMatchDefault(seg, highlightTag, fullClassName, fullStyle, key);
  });

  return createElement(as, { ref, className, style }, ...children);
});
