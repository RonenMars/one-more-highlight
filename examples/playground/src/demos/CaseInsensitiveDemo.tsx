import { Highlight } from 'one-more-highlight';

// Scenario: a search-results page where the user typed "react" lowercase.
// In the left column, all three casings match (the default, most useful for
// user-facing search). In the right column, caseSensitive forces an exact
// match — only the lowercase "react" is highlighted.
// Useful contrast for: code search vs. content search.
const text = 'React, react, REACT — three ways to write the same word.';

export function CaseInsensitiveDemo() {
  return (
    <div className="demo-cols">
      <div className="demo-col">
        <h3>caseSensitive=false (default)</h3>
        <Highlight text={text} searchWords={['react']} caseSensitive={false} highlightClassName="hl-base" />
      </div>
      <div className="demo-col">
        <h3>caseSensitive=true</h3>
        <Highlight text={text} searchWords={['react']} caseSensitive={true} highlightClassName="hl-base" />
      </div>
    </div>
  );
}
