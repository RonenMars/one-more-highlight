declare global {
  interface Window {
    Highlight?: new (...ranges: Range[]) => unknown;
  }
}

function detect(): boolean {
  if (typeof globalThis === 'undefined') return false;
  const css = (globalThis as { CSS?: { highlights?: unknown } }).CSS;
  if (!css || typeof css.highlights === 'undefined') return false;
  const Hl = (globalThis as { Highlight?: unknown }).Highlight;
  return typeof Hl === 'function';
}

let cached: boolean | undefined;

export function supported(): boolean {
  if (cached === undefined) cached = detect();
  return cached;
}

// Test-only: reset the cache so fallback tests can stub globalThis.CSS.
export function __resetSupportedCacheForTests(): void {
  cached = undefined;
}
