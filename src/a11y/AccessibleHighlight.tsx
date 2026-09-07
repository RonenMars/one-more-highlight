import clsx from 'clsx';
import { Fragment, createElement, forwardRef } from 'react';
import type { CSSProperties, ElementRef } from 'react';
import { CssHighlight } from '../css/CssHighlight.js';
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
  const isCss = props.engine === 'css';

  // The DOM engine's `native` and `annotated` output is already accessible as
  // rendered, so it needs no second layer.
  if (!isCss) {
    if (mode === 'native') return <Highlight ref={ref} {...props} />;
    if (mode === 'annotated') return <AnnotatedHighlight ref={ref} {...props} />;
  }

  // Everything else splits in two: an aria-hidden visual layer plus a
  // visually-hidden accessible one. For `dual` because the visual layer is
  // fragmented and reads badly; for every CSS-engine mode because painted
  // ranges carry no DOM to be accessible with. Building the accessible layer
  // from `mode` alone is what makes it engine-independent — including on
  // browsers where CssHighlight degrades to <mark>, since that degraded
  // markup lands inside the aria-hidden layer too.
  return (
    <span ref={ref}>
      <span aria-hidden="true">
        {isCss ? <CssHighlight {...props} /> : <Highlight {...props} />}
      </span>
      <span style={visuallyHiddenStyle}>
        {mode === 'dual' ? (
          props.text
        ) : mode === 'native' ? (
          <Highlight {...props} />
        ) : (
          <AnnotatedHighlight {...props} />
        )}
      </span>
    </span>
  );
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
