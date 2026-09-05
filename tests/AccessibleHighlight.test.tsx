import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessibleHighlight } from '../src/a11y/AccessibleHighlight.js';

describe('<AccessibleHighlight>', () => {
  it('mode="native" renders identically to <Highlight>', () => {
    const { container } = render(
      <AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode="native" />,
    );
    expect(container.querySelectorAll('mark')).toHaveLength(2);
  });

  it('defaults to mode="native" when mode is omitted', () => {
    const { container } = render(
      <AccessibleHighlight text="cat hat cat" searchWords={['cat']} />,
    );
    expect(container.querySelectorAll('mark')).toHaveLength(2);
  });

  it('mode="dual" hides the fragmented visual layer and exposes an unbroken text copy', () => {
    const { container } = render(
      <AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode="dual" />,
    );
    const hiddenLayer = container.querySelector('[aria-hidden="true"]');
    expect(hiddenLayer).toBeInTheDocument();
    expect(hiddenLayer?.querySelectorAll('mark')).toHaveLength(2);
    expect(screen.getByText('cat hat cat')).toBeInTheDocument();
  });

  it('mode="annotated" wraps each match with visually-hidden boundary markers', () => {
    const { container } = render(
      <AccessibleHighlight text="cat hat cat" searchWords={['cat']} mode="annotated" />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    for (const mark of marks) {
      expect(mark).toHaveTextContent('highlight startcathighlight end');
    }
    expect(screen.getAllByText('highlight start')).toHaveLength(2);
    expect(screen.getAllByText('highlight end')).toHaveLength(2);
  });

  it('mode="annotated" ignores highlightTag and renderMatch (it renders matches itself)', () => {
    const { container } = render(
      <AccessibleHighlight
        text="cat hat cat"
        searchWords={['cat']}
        mode="annotated"
        highlightTag="strong"
        renderMatch={() => 'custom'}
      />,
    );
    // Still plain <mark>, not <strong>, and not the custom renderMatch output —
    // this mode splices boundary markers into its own <mark> rendering and
    // has no hook for either escape hatch. If this ever changes, this test
    // should be updated deliberately, not silently pass.
    expect(container.querySelectorAll('mark')).toHaveLength(2);
    expect(container.querySelectorAll('strong')).toHaveLength(0);
    expect(container.textContent).not.toContain('custom');
  });

  it('mode="annotated" applies per-state styling like <Highlight>', () => {
    const { container } = render(
      <AccessibleHighlight
        text="cat cat"
        searchWords={['cat']}
        mode="annotated"
        highlightClassName="base"
        states={[{ name: 'active', index: 1, className: 'active' }]}
      />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks[0]).toHaveClass('base');
    expect(marks[0]).not.toHaveClass('active');
    expect(marks[1]).toHaveClass('base', 'active');
  });
  it('renders correctly when mode changes at runtime', () => {
    // The playground exposes a mode selector, so toggling is a real usage path.
    // Note this passes with or without the AnnotatedHighlight split: React 19
    // does not throw when a component that rendered no hooks starts rendering
    // some. The split is required by react-hooks/rules-of-hooks, which is the
    // actual guard here — this test only covers the user-visible behaviour.
    const { rerender, container } = render(
      <AccessibleHighlight mode="native" text="the cat sat" searchWords={['cat']} />,
    );
    for (const mode of ['dual', 'annotated', 'native', 'annotated', 'dual'] as const) {
      expect(() =>
        rerender(<AccessibleHighlight mode={mode} text="the cat sat" searchWords={['cat']} />),
      ).not.toThrow();
    }
    expect(container.textContent).toContain('cat');
  });

});
