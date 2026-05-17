import { useState } from 'react';
import { Highlight } from 'one-more-highlight';
import { CssHighlight } from 'one-more-highlight/css';

const text =
  'The quick brown fox jumps over the lazy dog. ' +
  'The fox sees another fox in the distance. ' +
  'Soon the fox is gone, and the dog rests.';

const searchWords = ['fox', 'dog'];
const states = [
  { name: 'active', index: 1 },
  { name: 'pinned', indices: [2, 4] },
];

export function CssEngineDemo() {
  const [engine, setEngine] = useState<'dom' | 'css'>('css');
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Engine:&nbsp;
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value as 'dom' | 'css')}
        >
          <option value="dom">DOM (&lt;mark&gt; spans)</option>
          <option value="css">CSS Custom Highlight API</option>
        </select>
      </label>
      {engine === 'dom' ? (
        <Highlight
          text={text}
          searchWords={searchWords}
          highlightClassName="hl-base"
          states={[
            { name: 'active', index: 1, className: 'hl-active' },
            { name: 'pinned', indices: [2, 4], className: 'hl-bookmark' },
          ]}
        />
      ) : (
        <CssHighlight text={text} searchWords={searchWords} states={states} />
      )}
    </div>
  );
}
