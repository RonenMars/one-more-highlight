import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CssHighlight } from '../src/css/CssHighlight.js';

describe('<CssHighlight>', () => {
  it('renders a single Text node child inside the wrapper', () => {
    const { container } = render(
      <CssHighlight text="hello world" searchWords={['world']} fallback="none" />,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.tagName).toBe('SPAN');
    expect(wrapper?.childNodes).toHaveLength(1);
    expect(wrapper?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(wrapper?.firstChild?.textContent).toBe('hello world');
  });

  it('renders zero <mark> elements', () => {
    const { container } = render(
      <CssHighlight text="cat cat cat" searchWords={['cat']} fallback="none" />,
    );
    expect(container.querySelectorAll('mark')).toHaveLength(0);
  });

  it('honors the `as` prop to change the wrapper tag', () => {
    const { container } = render(
      <CssHighlight text="abc" searchWords={[]} as="div" fallback="none" />,
    );
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('forwards className and style to the wrapper', () => {
    const { container } = render(
      <CssHighlight
        text="abc"
        searchWords={[]}
        className="outer"
        style={{ color: 'red' }}
        fallback="none"
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('outer');
    expect(wrapper.style.color).toBe('red');
  });
});
