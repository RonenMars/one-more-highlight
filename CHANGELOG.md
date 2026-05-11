## [0.1.1](https://github.com/RonenMars/one-more-highlight/compare/v0.1.0...v0.1.1) (2026-05-11)


### Bug Fixes

* **ci:** remove explicit pnpm version—let action-setup read packageManager field ([37152b0](https://github.com/RonenMars/one-more-highlight/commit/37152b07921f8774df9cf98e83ec28ac0b4162d4))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-11

### Added
- Initial scaffold: TypeScript-first React substring highlighting.
- `<Highlight>` component with multi-state per-match styling.
- `useHighlight` headless hook.
- `match.one` / `match.range` / `match.many` selector builders.
- `renderMatch` render-prop for full per-match control.
- Three overlap strategies: `merge` (default), `nest`, `first-wins`.
- Native-first `RegExp.escape()` with `escape-string-regexp` fallback.
