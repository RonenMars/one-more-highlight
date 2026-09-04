# Landing Source Audit

## Canonical baseline

The canonical implementation is `landing/index.html` on the refreshed `origin/main`.

The target worktree and `origin/main` both resolve to `b1898c2a190a16716fd32d4fde17512c4a2a2d5f`.
The baseline is package version `1.3.1`, with `one-more-highlight`, `one-more-highlight/css`, and `one-more-highlight/native` public exports.
The canonical landing links to the published docs, StackBlitz playground, repository, npm package, and changelog, while the docs configuration uses the same canonical site, repository, playground, and npm destinations.

## React Native reconciliation

The React Native clone is a separate repository clone; its `main` is an ancestor of canonical `origin/main`, so no React Native commit is missing from canonical history.

This is the Task 2 reconciliation result.
No React Native source, including its protected untracked files, is a Task 3 import source.

## Source inventory and provenance

| Source group | Role | Provenance and handling |
| --- | --- | --- |
| `archive/notes/docs/design/IDEAS.md` | Design backlog and landing ideas | Read as backlog evidence only. |
| `archive/notes/docs/landing-page-prompt.md` | Stale design prompt and verbatim copy | Historical prompt, not current product copy or API authority. |
| `archive/prototypes/landing*/` | Static visual prototypes | Visual reference only; its HTML, CSS, and assets are not production source. |
| `archive/workspace/*.jsx` and `archive/workspace/_archive/*` | Generated design-tool/source exports | Contains generated exports, including obsolete API and release material; exclude from production. |
| `archive/workspace/assets/*` | Brand and favicon candidates | Compare against the tracked landing and docs assets before considering any use. |
| `stitch/DESIGN.md` | Technical Ink design tokens and rules | Reusable design reference only. |
| `stitch/code.html` | Generated dark landing prototype | Reference only; it includes external design-tool scaffolding and placeholder navigation targets. |
| `stitch/screen.png` | Rendered reference image | Reference image only, never a production asset. |

`archive` contains an uploaded copy of the Stitch export at `archive/workspace/uploads/stitch_one_more_highlight_landing_page/`.
Its `DESIGN.md`, `code.html`, and `screen.png` are byte-identical to the corresponding files in the standalone `stitch` directory.
The standalone Stitch directory is therefore the canonical source for that export, and the uploaded copy is excluded as a duplicate.

## Current landing and docs comparison

| Check | Classification | Source evidence | Current canonical evidence |
| --- | --- | --- | --- |
| Real React and React Native product claims | already present | `archive/notes/docs/design/IDEAS.md` and the design sources frame multi-state React highlighting. | `landing/index.html` describes React and React Native; `src/index.ts` exports `Highlight`, and `src/native/index.ts` exports `HighlightText`. |
| Current package, API names, and import paths | already present | Archive prompt and exported examples propose package examples, but generated workspace examples also use obsolete props. | `package.json`, `src/index.ts`, `src/css/index.ts`, `src/native/index.ts`, and `docs/site/docs/api/` define the current package and exports. |
| Actual docs, playground, GitHub, npm, and canonical URLs | already present | `stitch/code.html` and archived exports contain placeholder navigation targets, so they cannot supply destinations. | `landing/index.html` and `docs/site/docusaurus.config.ts` contain the canonical deployed docs, StackBlitz playground, GitHub, npm, and changelog URLs. |
| Light and dark theme behavior and reduced-motion behavior | already present | The archive prompt and Stitch rules are styling references. | `landing/index.html` persists the selected light/dark theme and has reduced-motion overrides; `docs/site/docusaurus.config.ts` and `docs/site/src/css/custom.css` define the docs color mode and both theme palettes. |
| Rendered multi-state highlighting | candidate improvement | `archive/notes/docs/design/IDEAS.md` proposes a richer rendered multi-state demonstration. | `landing/index.html` already has a compact rendered preview, and `docs/site/docs/guides/multi-state-styling.mdx` documents the behavior. Defer any expanded presentation to a landing-page change. |
| Selector forms | candidate improvement | `archive/notes/docs/design/IDEAS.md` proposes focused selector-form examples. | `landing/index.html` already shows `index`, `range`, and `indices`; `docs/site/docs/guides/multi-state-styling.mdx` defines all three. Defer any additional landing treatment. |
| Install instructions | already present | The archive prompt and Stitch prototype propose install calls, but are not current release authority. | `landing/index.html` and `docs/site/docs/getting-started/quick-start.md` use `pnpm add one-more-highlight`. |
| Responsive behavior | already present | `archive/notes/docs/landing-page-prompt.md` asks for a single-column mobile layout. | `landing/index.html` uses mobile-first layout and wider-screen grid rules. |
| Code-block overflow | already present | `archive/notes/docs/landing-page-prompt.md` asks for horizontal scrolling rather than wrapping. | `landing/index.html` sets horizontal overflow for code and install command surfaces. |

## Relevance rubric

A source item is relevant only when all four conditions hold:

1. It represents content missing from the current repository, not a duplicate.
2. It describes the current public API and current release facts truthfully.
3. It can be brought in without node/runtime dependencies or generated scaffolding.
4. It has a clear destination and a validation method in the current repository.

The archive's rendered multi-state preview and selector-form examples are the strongest content ideas, but the canonical landing already covers each in compact form and the docs provide the detailed explanation.
They remain candidate landing improvements, not silent imports during this reconciliation.

## Archive sources

### Accepted as reference evidence

- `archive/notes/docs/design/IDEAS.md`: retain the rendered multi-state preview and selector-form concepts as deferred landing ideas.
- `archive/workspace/assets/*`: retain only the audited asset provenance below; no asset is accepted for copying.

### Stale claims and excluded generated files

- `archive/notes/docs/landing-page-prompt.md` is stale prompt material and verbatim copy, not a source of current API, release, or URL facts.
- `archive/workspace/_archive/Brand Kit v2.html` uses obsolete `match`, `specific`, and `specificStyle` examples rather than the current `searchWords` and `states` API.
- `archive/workspace/_archive/landing.jsx` and its generated `dist` copy advertise version `v0.5.1`, which conflicts with current package version `1.3.1`.
- `archive/workspace/*.jsx`, `archive/workspace/_archive/*`, and `archive/prototypes/landing*/` are design-tool, static-prototype, or generated source material. Their JSX, HTML, CSS, and images are intentionally excluded.
- Archived navigation placeholders and unsupported destinations are excluded; current links must continue to come from `landing/index.html` and `docs/site/docusaurus.config.ts`.

### Exact favicon comparison

| Canonical tracked asset | Archive candidate | SHA-256 result | Decision |
| --- | --- | --- | --- |
| `landing/assets/favicon.svg` | `archive/prototypes/landing/assets/favicon.svg` | Both `d1bfa1cfabdfeee202c108b8a1b78240c4faa9f9e2e1d82e88c87334320cb7aa` | Exact duplicate; exclude. |
| `landing/assets/favicon.svg` | `archive/prototypes/landing-2/assets/favicon.svg` | Both `d1bfa1cfabdfeee202c108b8a1b78240c4faa9f9e2e1d82e88c87334320cb7aa` | Exact duplicate; exclude. |
| `docs/site/static/img/favicon-omh-dark.svg` | `archive/workspace/_archive/exports/favicon-omh-dark.svg` | Both `f379725e1265295ff2c987c88b7100d2ed022e1280f4c4416ec465782c76e956` | Exact duplicate; exclude. |
| `docs/site/static/img/favicon-omh-light.svg` | `archive/workspace/_archive/exports/favicon-omh-light.svg` | Both `7d760be05ccb4a64de25a7dd4a60751fd1b0b3aea11f2f4ed2170b500d94ba5e` | Exact duplicate; exclude. |
| `landing/assets/favicon.svg` | `archive/workspace/assets/favicon.svg` | Canonical `d1bfa1cfabdfeee202c108b8a1b78240c4faa9f9e2e1d82e88c87334320cb7aa`; candidate `7b7b7fe3e112dc8c93179df008a4c92022dd812d5f2243f503a40798499a09d7` | Different candidate without a validated need; exclude. |
| `landing/assets/favicon.svg` | `archive/workspace/assets/favicon-v2.svg` | Canonical `d1bfa1cfabdfeee202c108b8a1b78240c4faa9f9e2e1d82e88c87334320cb7aa`; candidate `2cbbd85dd0f875ce9ebec188b52c4884db8264282f9cbb8611f7c945943c36dd` | Different candidate without a validated need; exclude. |

## Stitch sources

`stitch/DESIGN.md` is accepted as a design reference for the Technical Ink palette roles, typography pairing, structural borders, generous spacing, mobile stacking, and tactile highlighter treatment.
It does not override the canonical landing's existing light/dark theme behavior, product facts, or brand tokens.

`stitch/code.html` remains a generated dark landing prototype rather than production source because it includes a Tailwind CDN configuration, external font and icon scaffolding, and placeholder navigation targets.
`stitch/screen.png` remains a rendered reference image rather than a generated asset to ship.
Neither file supplies current API, release, or link facts, and neither has a direct, dependency-free import path with a scoped validation target.

## Import decision

| Classification | Decision |
| --- | --- |
| Accepted | Keep `archive/notes/docs/design/IDEAS.md` and `stitch/DESIGN.md` as reference evidence only. No external source file is copied. |
| Deferred | Consider a future landing-page change for a fuller rendered multi-state preview and dedicated selector-form presentation, validated against the current `Highlight` API and canonical links. |
| Excluded | All static or generated HTML, JSX, CSS, screenshots, uploaded Stitch duplicates, stale prompt copy, stale API or release claims, placeholder destinations, and favicon duplicates or unvalidated variants. |

New or modified repository path: `docs/design/landing-source-audit.md`.
No production landing code is changed by this reconciliation; `landing/index.html` is intentionally unchanged.
