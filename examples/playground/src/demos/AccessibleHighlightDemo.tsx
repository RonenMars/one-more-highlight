import { useState } from 'react';
import { AccessibleHighlight } from 'one-more-highlight/a11y';
import type { AccessibilityMode } from 'one-more-highlight/a11y';

// Scenario: same search-results text as the basic demo, rendered through
// <AccessibleHighlight> so the three assistive-technology modes can be
// compared. 'dual' and 'annotated' add visually-hidden text — this demo
// intentionally looks identical to <Highlight> across all three modes; the
// difference only shows up to a screen reader (or in the DOM inspector).
const text =
  'React is a JavaScript library for building user interfaces. ' +
  'Most React apps use components, JSX, and the React hooks API.';

export function AccessibleHighlightDemo() {
  const [mode, setMode] = useState<AccessibilityMode>('native');
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Mode:&nbsp;
        <select value={mode} onChange={(e) => setMode(e.target.value as AccessibilityMode)}>
          <option value="native">native</option>
          <option value="dual">dual</option>
          <option value="annotated">annotated</option>
        </select>
      </label>
      <AccessibleHighlight
        text={text}
        searchWords={['React']}
        mode={mode}
        highlightClassName="hl-base"
      />
    </div>
  );
}
