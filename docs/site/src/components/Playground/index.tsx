import React, { useCallback, useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import * as BabelStandalone from '@babel/standalone';
import * as OneMoreHighlight from 'one-more-highlight';

// The demo code imports from this URL. The dynamicImport interceptor maps it to
// the Webpack-bundled one-more-highlight so hooks share the page's React instance.
const ESM_URL = 'https://esm.sh/one-more-highlight';

const DEMOS: Record<string, string> = {
  Basic: `import { Highlight } from '${ESM_URL}';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export default function App() {
  return (
    <Highlight
      text={text}
      searchWords={['time']}
      highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
    />
  );
}`,

  'Multi-state': `import { Highlight, match } from '${ESM_URL}';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export default function App() {
  return (
    <Highlight
      text={text}
      searchWords={['time']}
      highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
      states={[
        { name: 'preview', ...match.range(0, 1), style: { background: 'var(--hl-pink)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' } },
        { name: 'active', ...match.one(2), style: { background: 'var(--hl-green)', color: 'var(--hl-text)', padding: '0 3px', borderRadius: '3px', fontWeight: 'bold' } },
        { name: 'bookmarked', ...match.many([3, 5]), style: { background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px', textDecoration: 'underline' } },
      ]}
    />
  );
}`,

  'Render prop': `import { Highlight, match } from '${ESM_URL}';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export default function App() {
  return (
    <Highlight
      text={text}
      searchWords={['time']}
      highlightStyle={{ background: 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}
      states={[{ name: 'active', ...match.one(2), style: { background: 'var(--hl-green)', color: 'var(--hl-text)' } }]}
      renderMatch={(seg, { style, Tag }) => (
        <Tag style={style}>
          {seg.text}{seg.states.includes('active') && <sup style={{ color: 'var(--hl-amber)' }}>★</sup>}
        </Tag>
      )}
    />
  );
}`,

  Headless: `import { match, useHighlight } from '${ESM_URL}';

const text =
  'It is truly sometimes and time-to-time hard to realize that in this time of rapid change, ' +
  'we must take the time to make time for what matters most, because once time passes, you can ' +
  'never get that time back, making every time we meet a valuable time.';

export default function App() {
  const segments = useHighlight({
    text,
    searchWords: ['time'],
    states: [{ name: 'active', ...match.one(2) }],
  });
  return (
    <p style={{ margin: 0 }}>
      {segments.map((s, i) =>
        s.isMatch ? (
          <mark key={i} style={{ background: s.states.includes('active') ? 'var(--hl-green)' : 'var(--hl-yellow)', color: 'var(--hl-text)', padding: '0 2px', borderRadius: '2px' }}>
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  );
}`,
};

type EvalResult = { element: React.ReactElement | null; error: string | null };

async function evalCode(code: string): Promise<EvalResult> {
  try {
    const Babel = BabelStandalone as unknown as {
      transform: (code: string, opts: Record<string, unknown>) => { code: string };
    };

    // Strip imports/export default BEFORE Babel so sourceType:'script' stays happy.
    // AsyncFunction body is implicitly async, so top-level await is valid there.
    const importLines: string[] = [];
    const stripped = code
      .replace(
        /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\n?/gm,
        (_match, names: string, url: string) => {
          importLines.push(`const {${names}} = await __import('${url}');`);
          return '';
        }
      )
      .replace(/^export\s+default\s+function\s+(\w+)/m, 'const __exports_default = function $1')
      .replace(/^export\s+default\s+/m, 'const __exports_default = ');

    const bodyTransformed = Babel.transform(stripped, {
      presets: [['react', { runtime: 'classic' }]],
      sourceType: 'script',
    }).code;

    const fullBody = `${importLines.join('\n')}\n${bodyTransformed}\nreturn __exports_default;`;

    // Intercept the ESM_URL to return the Webpack-bundled one-more-highlight — this
    // ensures the Highlight component uses the page's React instance (same hooks dispatcher).
    const rawImport = new Function('url', 'return import(url)'); // intentional: bypass bundler static analysis
    const dynamicImport = (url: string) =>
      url === ESM_URL ? Promise.resolve(OneMoreHighlight) : rawImport(url);
    const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
    // AsyncFunction body is implicitly async — top-level await is valid here.
    const fn = new AsyncFn('React', '__import', fullBody); // intentional: playground eval
    const Component = await fn(React, dynamicImport);
    return { element: React.createElement(Component), error: null };
  } catch (e: unknown) {
    return { element: null, error: e instanceof Error ? e.message : String(e) };
  }
}

function PlaygroundInner({ initialDemo }: { initialDemo: string }) {
  const [activeDemo, setActiveDemo] = useState(initialDemo);
  const [code, setCode] = useState(DEMOS[initialDemo] ?? DEMOS.Basic);
  const [result, setResult] = useState<EvalResult>({ element: null, error: null });
  const [running, setRunning] = useState(false);
  const MonacoEditor = useRef<typeof import('@monaco-editor/react').default | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    import('@monaco-editor/react').then((m) => {
      MonacoEditor.current = m.default;
      setEditorReady(true);
    });
  }, []);

  const run = useCallback(async (src: string) => {
    setRunning(true);
    const res = await evalCode(src);
    setResult(res);
    setRunning(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => run(code), 400);
    return () => clearTimeout(timer);
  }, [code, run]);

  function selectDemo(name: string) {
    setActiveDemo(name);
    setCode(DEMOS[name]);
  }

  const Editor = MonacoEditor.current;

  return (
    <div style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', overflow: 'hidden', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ifm-color-emphasis-300)', background: 'var(--ifm-background-surface-color)', overflowX: 'auto' }}>
        {Object.keys(DEMOS).map((name) => (
          <button
            key={name}
            onClick={() => selectDemo(name)}
            style={{
              padding: '0.4rem 0.9rem',
              border: 'none',
              borderBottom: activeDemo === name ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
              background: 'none',
              color: activeDemo === name ? 'var(--ifm-color-primary)' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer',
              fontWeight: activeDemo === name ? 600 : 400,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '280px', borderBottom: '1px solid var(--ifm-color-emphasis-300)' }}>
          {editorReady && Editor ? (
            <Editor
              height="280px"
              defaultLanguage="javascript"
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                padding: { top: 8 },
              }}
            />
          ) : (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', height: '280px', padding: '8px', fontFamily: 'monospace', fontSize: '13px', background: '#1e1e1e', color: '#d4d4d4', border: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          )}
        </div>

        <div style={{ padding: '1rem', minHeight: '80px', background: 'var(--ifm-background-surface-color)', lineHeight: 1.6, position: 'relative' }}>
          {running && (
            <span style={{ fontSize: '0.8rem', color: 'var(--ifm-color-content-secondary)', position: 'absolute', top: '0.5rem', right: '0.75rem' }}>
              running…
            </span>
          )}
          {result.error ? (
            <pre style={{ color: '#f87171', fontSize: '0.8rem', margin: 0, whiteSpace: 'pre-wrap' }}>{result.error}</pre>
          ) : (
            result.element
          )}
        </div>
      </div>
    </div>
  );
}

export function Playground({ demo = 'Basic' }: { demo?: string }) {
  return (
    <BrowserOnly fallback={<div style={{ height: '380px', background: 'var(--ifm-background-surface-color)', borderRadius: '8px' }} />}>
      {() => <PlaygroundInner initialDemo={demo} />}
    </BrowserOnly>
  );
}
