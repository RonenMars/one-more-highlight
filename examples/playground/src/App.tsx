import { BasicDemo } from './demos/BasicDemo.js';
import { HeadlessDemo } from './demos/HeadlessDemo.js';
import { MultiStateDemo } from './demos/MultiStateDemo.js';
import { RenderPropDemo } from './demos/RenderPropDemo.js';

export function App() {
  return (
    <main>
      <h1>one-more-highlight · playground</h1>

      <h2>1. Basic — every "time" highlighted</h2>
      <div className="demo">
        <BasicDemo />
      </div>

      <h2>2. Multi-state — base + active(2) + preview(0–1) + bookmarked(3,5)</h2>
      <div className="demo">
        <MultiStateDemo />
      </div>

      <h2>3. Render-prop — star next to the active match</h2>
      <div className="demo">
        <RenderPropDemo />
      </div>

      <h2>4. Headless hook — DIY rendering</h2>
      <div className="demo">
        <HeadlessDemo />
      </div>
    </main>
  );
}
