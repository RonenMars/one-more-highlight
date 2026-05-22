import { Highlight } from 'one-more-highlight';

// Scenario: an autocomplete-style UI where the user has typed two queries.
// Each query keeps its own color across re-orderings — that's the whole
// point of term-based selectors versus the global-index forms.
const text = 'A cat sat on the mat. The dog ran past. Another cat watched.';

export function PerTermDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ term: 'cat' } & { term: 'dog' } — color stays with each term`}</small>
        <div>
          <Highlight
            text={text}
            searchWords={['cat', 'dog']}
            highlightClassName="hl-base"
            states={[
              { name: 'cat', term: 'cat', className: 'hl-one' },
              { name: 'dog', term: 'dog', className: 'hl-range' },
            ]}
          />
        </div>
      </div>
      <div>
        <small style={{ opacity: 0.6 }}>{`{ term: 'cat', nth: 0 } — first occurrence of 'cat' only`}</small>
        <div>
          <Highlight
            text={text}
            searchWords={['cat', 'dog']}
            highlightClassName="hl-base"
            states={[
              { name: 'first-cat', term: 'cat', nth: 0, className: 'hl-many' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
