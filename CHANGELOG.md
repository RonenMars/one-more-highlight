# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial scaffold: TypeScript-first React substring highlighting.
- `<Highlight>` component with multi-state per-match styling.
- `useHighlight` headless hook.
- `match.one` / `match.range` / `match.many` selector builders.
- `renderMatch` render-prop for full per-match control.
- Three overlap strategies: `merge` (default), `nest`, `first-wins`.
- Native-first `RegExp.escape()` with `escape-string-regexp` fallback.
