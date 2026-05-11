---
sidebar_position: 1
---

# Browser support

## Support matrix

| Environment | Support | Notes |
|---|---|---|
| Chrome / Edge 112+ | ✅ Full | Native `RegExp.escape()` available |
| Firefox 134+ | ✅ Full | Native `RegExp.escape()` available |
| Safari 18.4+ | ✅ Full | Native `RegExp.escape()` available |
| Older evergreen browsers | ✅ Full | Falls back to `escape-string-regexp` automatically |
| Node.js 18+ | ✅ Full | Required for `escape-string-regexp` v5 (ESM) |
| Node.js < 18 | ❌ | `escape-string-regexp` v5 is ESM-only |
| SSR (Next.js, Remix) | ✅ Full | Pipeline has no `window`/`document` reads |
| React Native | ⚠️ Untested | No known blockers; contributions welcome |
| IE 11 | ❌ | Not supported; library is ESM-only |

## Notes

**`RegExp.escape()` detection** is runtime — no build-time polyfill or configuration needed. When native `RegExp.escape` is absent, `escape-string-regexp` is used automatically.

**Case-insensitive matching** uses `String.prototype.toLowerCase()` (not the locale variant). This is intentional: locale-dependent matching produces different results across server and client environments, breaking SSR hydration.

**SSR** — the entire matching pipeline (`findMatches`, `combineChunks`, `applyStates`, `buildSegments`) contains no `window`, `document`, `localStorage`, or other browser-only globals. Keys derive from `${start}-${end}-${matchIndex}` and are stable across server and client renders.
