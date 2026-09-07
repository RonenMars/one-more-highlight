import { useState } from 'react';
import { AccessibleHighlight } from 'one-more-highlight/a11y';
import type { AccessibilityMode, HighlightEngine } from 'one-more-highlight/a11y';

// Scenario: same search-results text as the basic demo, rendered through
// <AccessibleHighlight> so the three assistive-technology modes can be
// compared. 'dual' and 'annotated' add visually-hidden text — this demo
// intentionally looks identical to <Highlight> across all three modes; the
// difference only shows up to a screen reader (or in the DOM inspector).
//
// The engine picker swaps how the pixels are painted: 'dom' renders <mark>,
// 'css' paints CSS Custom Highlight ranges (styled by ::highlight(match) in
// index.css). Both look the same and, for a given mode, expose the same
// thing to assistive technology — inspect the DOM to see how differently
// they get there.
const text =
  'React is a JavaScript library for building user interfaces. ' +
  'Most React apps use components, JSX, and the React hooks API.';

export function AccessibleHighlightDemo() {
  const [mode, setMode] = useState<AccessibilityMode>('native');
  const [engine, setEngine] = useState<HighlightEngine>('dom');
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Mode:&nbsp;
        <select value={mode} onChange={(e) => setMode(e.target.value as AccessibilityMode)}>
          <option value="native">native</option>
          <option value="dual">dual</option>
          <option value="annotated">annotated</option>
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Engine:&nbsp;
        <select value={engine} onChange={(e) => setEngine(e.target.value as HighlightEngine)}>
          <option value="dom">dom</option>
          <option value="css">css</option>
        </select>
      </label>
      {/* Capture target for the visual suite: the pickers above render their
          own selected values, so a snapshot of the whole demo differs between
          modes for a reason that has nothing to do with highlighting. */}
      <div data-testid="a11y-output">
        <AccessibleHighlight
          text={text}
          searchWords={['React']}
          mode={mode}
          engine={engine}
          highlightClassName="hl-base"
        />
      </div>
    </div>
  );
}
