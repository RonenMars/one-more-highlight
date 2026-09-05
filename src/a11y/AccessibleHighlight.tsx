import clsx from 'clsx';
import { Fragment, createElement, forwardRef } from 'react';
import type { CSSProperties, ElementRef } from 'react';
import { Highlight, resolveStateStyles } from '../Highlight.js';
import { useHighlight } from '../useHighlight.js';
import { visuallyHiddenStyle } from './visuallyHidden.js';
import type { AccessibleHighlightProps } from './types.js';

export const AccessibleHighlight = forwardRef<
  ElementRef<'span'>,
  AccessibleHighlightProps
>(function AccessibleHighlight(props, ref) {
  // Not rest-destructured: object rest over a discriminated union loses the
  // correlation between `searchWords`/`ranges` and the rest of the source.
  const mode = props.mode ?? 'native';

  if (mode === 'native') {
    return <Highlight ref={ref} {...props} />;
  }

  if (mode === 'dual') {
    // Fragmented visual layer is hidden from AT; an unbroken copy of the
    // source text carries the accessible content instead.
    return (
      <span ref={ref}>
        <span aria-hidden="true">
          <Highlight {...props} />
        </span>
        <span style={visuallyHiddenStyle}>{props.text}</span>
      </span>
    );
  }

  return <AnnotatedHighlight ref={ref} {...props} />;
});

// `annotated` lives in its own component because it needs useHighlight, and the
// modes above return before that call — a hook behind a branch changes hook
// order when `mode` changes at runtime, which React cannot tolerate.
const AnnotatedHighlight = forwardRef<
  ElementRef<'span'>,
  AccessibleHighlightProps
>(function AnnotatedHighlight(props, ref) {
  // visual layer stays in the accessibility tree; each match
  // gets visually-hidden "highlight start"/"highlight end" boundary text so
  // AT users know where a highlighted run begins and ends. Renders matches
  // as <mark> directly rather than delegating to <Highlight>, since it needs
  // to splice in the boundary markers around each match's children —
  // `highlightTag`/`renderMatch` aren't honored in this mode.
  const {
    states,
    highlightClassName,
    highlightStyle,
    unhighlightTag,
    unhighlightClassName,
    unhighlightStyle,
    as = 'span',
    className,
    style,
  } = props;

  // Passed whole: the source is a discriminated union and rebuilding it field
  // by field would lose the correlation.
  const { segments } = useHighlight(props);

  const children = segments.map((seg, i) => {
    const key = `${seg.start}-${seg.end}-${i}`;
    if (!seg.isMatch) {
      if (!unhighlightTag && !unhighlightClassName && !unhighlightStyle) return seg.text;
      if (unhighlightTag) {
        return createElement(
          unhighlightTag,
          { key, className: unhighlightClassName, style: unhighlightStyle },
          seg.text,
        );
      }
      return createElement(Fragment, { key }, seg.text);
    }

    const { classNames, styles } = resolveStateStyles(seg.states, states);
    const fullClassName = clsx(highlightClassName, ...classNames) || undefined;
    const fullStyle: CSSProperties = Object.assign({}, highlightStyle, ...styles);

    return (
      <mark
        key={key}
        className={fullClassName}
        style={Object.keys(fullStyle).length > 0 ? fullStyle : undefined}
      >
        <span style={visuallyHiddenStyle}>highlight start</span>
        {seg.text}
        <span style={visuallyHiddenStyle}>highlight end</span>
      </mark>
    );
  });

  return createElement(as, { ref, className, style }, ...children);
});
