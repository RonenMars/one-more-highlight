import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.js';
import { ThemeWrapper } from './ThemeWrapper.js';
import { Index } from './Index.js';
import { BasicDemo } from './demos/BasicDemo.js';
import { CaseInsensitiveDemo } from './demos/CaseInsensitiveDemo.js';
import { HeadlessDemo } from './demos/HeadlessDemo.js';
import { MultiStateDemo } from './demos/MultiStateDemo.js';
import { OverlapFirstDemo } from './demos/OverlapFirstDemo.js';
import { OverlapMergeDemo } from './demos/OverlapMergeDemo.js';
import { OverlapNestDemo } from './demos/OverlapNestDemo.js';
import { RegexDemo } from './demos/RegexDemo.js';
import { RenderPropDemo } from './demos/RenderPropDemo.js';
import { SelectorsDemo } from './demos/SelectorsDemo.js';

interface DemoPageProps {
  title: string;
  children: React.ReactNode;
}

function DemoPage({ title, children }: DemoPageProps) {
  return (
    <div className="page">
      <div className="demo-header">
        <h2>{title}</h2>
        <ThemeToggle />
      </div>
      <div data-testid="demo">{children}</div>
    </div>
  );
}

const demos = [
  { path: 'basic',            title: 'Basic — every "time" highlighted',                   Component: BasicDemo },
  { path: 'multi-state',      title: 'Multi-state — base + active + preview + bookmarked', Component: MultiStateDemo },
  { path: 'render-prop',      title: 'Render-prop — star next to the active match',        Component: RenderPropDemo },
  { path: 'headless',         title: 'Headless hook — DIY rendering',                      Component: HeadlessDemo },
  { path: 'overlap-merge',    title: 'Overlap strategy: merge',                             Component: OverlapMergeDemo },
  { path: 'overlap-nest',     title: 'Overlap strategy: nest',                              Component: OverlapNestDemo },
  { path: 'overlap-first',    title: 'Overlap strategy: first-wins',                        Component: OverlapFirstDemo },
  { path: 'regex',            title: 'RegExp search word — /\\btime\\b/i',                 Component: RegexDemo },
  { path: 'case-insensitive', title: 'Case-sensitive vs case-insensitive',                  Component: CaseInsensitiveDemo },
  { path: 'selectors',        title: 'Selectors — match.one / range / many',                Component: SelectorsDemo },
];

export function App() {
  return (
    <ThemeWrapper>
      <Routes>
        <Route path="/" element={<Index demos={demos} />} />
        <Route path="/dark" element={<Index demos={demos} dark />} />
        <Route path="/dark/" element={<Index demos={demos} dark />} />
        {demos.flatMap(({ path, title, Component }) => [
          <Route
            key={path}
            path={`/${path}`}
            element={<DemoPage title={title}><Component /></DemoPage>}
          />,
          <Route
            key={`dark/${path}`}
            path={`/dark/${path}`}
            element={<DemoPage title={title}><Component /></DemoPage>}
          />,
        ])}
        <Route path="*" element={<Index demos={demos} />} />
      </Routes>
    </ThemeWrapper>
  );
}
