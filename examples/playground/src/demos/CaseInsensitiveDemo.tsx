import { Highlight } from 'one-more-highlight';

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
