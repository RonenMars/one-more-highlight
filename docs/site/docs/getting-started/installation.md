---
sidebar_position: 2
---

# Installation

## Package manager

```bash
pnpm add one-more-highlight
# or
npm install one-more-highlight
# or
yarn add one-more-highlight
```

## Peer dependencies

```bash
pnpm add react react-dom
```

Requires **React 18 or 19**.

## Runtime dependencies

The library ships two small runtime dependencies — both MIT licensed, ~400 B combined:

| Package | Purpose |
|---|---|
| `clsx` | Class name joining |
| `escape-string-regexp` | Regex escaping fallback for browsers without native `RegExp.escape()` |

These are included automatically when you install `one-more-highlight`. You do not need to install them separately.

## Node.js requirement

`escape-string-regexp` v5 is ESM-only and requires **Node.js 18+**. This only affects build/SSR environments — browser consumers are unaffected.

## TypeScript

The package ships `.d.ts` and `.d.cts` declaration files alongside the ESM and CJS builds. No `@types/` package needed. Works with `strict` mode.
