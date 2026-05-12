## [0.3.4](https://github.com/RonenMars/one-more-highlight/compare/v0.3.3...v0.3.4) (2026-05-12)


### Bug Fixes

* **ci:** build library before semantic-release publish ([7b61cf3](https://github.com/RonenMars/one-more-highlight/commit/7b61cf375bad72dba9243b98e588743b3fe7df45))
* **playground:** use workspace:* to link local package for dev ([c2f21eb](https://github.com/RonenMars/one-more-highlight/commit/c2f21eb22030a4c21138edd6387eb4af3444f153))

## [0.3.3](https://github.com/RonenMars/one-more-highlight/compare/v0.3.2...v0.3.3) (2026-05-11)


### Bug Fixes

* **playground:** switch to live GitHub-linked sandbox URL ([e3303d9](https://github.com/RonenMars/one-more-highlight/commit/e3303d94f23891a883e26c28c3b252037c48194c))

## [0.3.2](https://github.com/RonenMars/one-more-highlight/compare/v0.3.1...v0.3.2) (2026-05-11)


### Bug Fixes

* **docs:** switch playground to owned CodeSandbox sandbox (stable URL) ([7292c86](https://github.com/RonenMars/one-more-highlight/commit/7292c8638a3d3409f8f5517a9462a08c478fa3ec))

## [0.3.1](https://github.com/RonenMars/one-more-highlight/compare/v0.3.0...v0.3.1) (2026-05-11)


### Bug Fixes

* **playground:** use published npm package instead of workspace ref for CodeSandbox ([cec3ab0](https://github.com/RonenMars/one-more-highlight/commit/cec3ab0e20489fe1f1003fbe478e688dba49bd86))

# [0.3.0](https://github.com/RonenMars/one-more-highlight/compare/v0.2.1...v0.3.0) (2026-05-11)


### Features

* **docs:** default to dark mode ([905478f](https://github.com/RonenMars/one-more-highlight/commit/905478fd28f9f2bb1d37acdbf5abe9a9e0cb0537))

## [0.2.1](https://github.com/RonenMars/one-more-highlight/compare/v0.2.0...v0.2.1) (2026-05-11)


### Bug Fixes

* **ci:** build library before docs site on Vercel ([58b5efd](https://github.com/RonenMars/one-more-highlight/commit/58b5efd3647ef39412040aa2c78c38557545edc9))

# [0.2.0](https://github.com/RonenMars/one-more-highlight/compare/v0.1.1...v0.2.0) (2026-05-11)


### Bug Fixes

* **docs:** correct nest strategy description and quick-start example ([6e3d095](https://github.com/RonenMars/one-more-highlight/commit/6e3d0959553b181729fc53471b1293a5a18d78b3))
* **docs:** use theme-aware CSS vars in LiveDemo containers for dark mode ([90038d9](https://github.com/RonenMars/one-more-highlight/commit/90038d968013d07402f254d2c541ab44bcb55a1b))


### Features

* **docs:** configure Docusaurus navbar, footer, and sidebar ([69690d5](https://github.com/RonenMars/one-more-highlight/commit/69690d5ec65e6cffda65baa33eb5285fcce16615))
* **docs:** replace default Docusaurus favicon with app icon ([d5d3a45](https://github.com/RonenMars/one-more-highlight/commit/d5d3a458a89e8555953be62a880da60cf2d35d55))
* **docs:** scaffold Docusaurus site at docs/site/ ([a1a2579](https://github.com/RonenMars/one-more-highlight/commit/a1a2579f42524b7a00040a68bd79a780aa0857aa))

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
