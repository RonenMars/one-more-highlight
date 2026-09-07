import { useEffect, useRef, useState } from 'react';
import { Highlighter } from 'one-more-highlight/vanilla';

// Scenario: highlighting markup the library did not render. The vanilla engine
// walks a DOM subtree instead of taking a `text` string, so "lazy dog" — split
// across <strong> below — is a single match. No string-based engine finds it.
// Left column paints via CSS.highlights (no DOM nodes added); right column
// forces the <mark> fallback used where that API is missing.
const searchWords = ['fox', 'lazy dog'];

// Namespaced `v-*` because CSS.highlights is a document-global registry keyed
// by name — an unnamespaced 'match' would share a bucket with the CSS engine demo.
const states = [
  { name: 'v-term-fox', term: 'fox' },
  { name: 'v-term-dog', term: 'lazy dog' },
];

function Passage() {
  return (
    <p>
      The quick brown <em>fox</em> jumps over the la<strong>zy do</strong>g. The
      fox sees another fox in the distance. Soon the fox is gone.
    </p>
  );
}

export function VanillaEngineDemo() {
  const cssRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState({ css: 0, mark: 0 });

  useEffect(() => {
    const el = cssRef.current;
    if (!el) return;
    const h = new Highlighter(el, { strategy: 'css', name: 'v-match' });
    const n = h.mark(searchWords, { states });
    setCounts((c) => ({ ...c, css: n }));
    return () => h.unmark();
  }, []);

  useEffect(() => {
    const el = markRef.current;
    if (!el) return;
    const h = new Highlighter(el, { strategy: 'mark', markClassName: 'hl-base' });
    const n = h.mark(searchWords);
    setCounts((c) => ({ ...c, mark: n }));
    return () => h.unmark();
  }, []);

  return (
    <div className="demo-cols">
      <div className="demo-col">
        <h3>strategy=css — {counts.css} matches, 0 nodes added</h3>
        <div ref={cssRef}>
          <Passage />
        </div>
      </div>
      <div className="demo-col">
        <h3>strategy=mark — {counts.mark} matches, wrapped</h3>
        <div ref={markRef}>
          <Passage />
        </div>
      </div>
    </div>
  );
}
