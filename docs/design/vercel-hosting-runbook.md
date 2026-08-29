# Vercel hosting runbook

How `one-more-highlight.vercel.app` is assembled. The layout this
describes is live (PR #11). For why the docs navbar title does not
point at `/`, see [ADR-0003](../adr/0003-docs-logo-links-to-docs-root.md).

## Current layout

| URL | Source | What the reader gets |
|---|---|---|
| `/` | `landing/` | Static marketing page |
| `/docs/` | `docs/site/build/` (Docusaurus) | Docs; `/docs/` redirects to `/docs/getting-started/intro` |

One Vercel project. No `docs.*` subdomain.

## Build

Root `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter one-more-highlight build && pnpm --filter one-more-highlight-docs build && node scripts/assemble-vercel-output.mjs",
  "outputDirectory": "vercel-output",
  "framework": null
}
```

`scripts/assemble-vercel-output.mjs` wipes `vercel-output/`, copies
`landing/` to the output root, then copies `docs/site/build` to
`vercel-output/docs`. `/vercel-output` is gitignored.

Docusaurus is configured for the sub-path:

- `docs/site/docusaurus.config.ts`: `url` is the apex host, `baseUrl` is
  `'/docs/'`.
- Docs `routeBasePath` is `'/'` (paths inside the Docusaurus app, under
  that base URL).

Landing links to docs with absolute `/docs/getting-started/intro` URLs.
Those stay correct as long as docs remain on this host's `/docs/`
prefix.

## Verify locally

```sh
pnpm install
pnpm --filter one-more-highlight build
pnpm --filter one-more-highlight-docs build
node scripts/assemble-vercel-output.mjs
npx serve vercel-output -p 4000
```

Then open `http://localhost:4000/` (landing) and
`http://localhost:4000/docs/` (docs intro via the redirect).

Push to `main` deploys. There is no `ignoreCommand`; every main push
rebuilds both surfaces.

## Editing either surface

| Change | Edit |
|---|---|
| Marketing copy, nav, OG image | `landing/index.html`, `landing/assets/` |
| Docs pages, theme, navbar | `docs/site/` |
| How the two trees are stitched | `scripts/assemble-vercel-output.mjs` and `vercel.json` |

Keep landing `index.html` at the output root and docs under `/docs/`.
Both need distinct canonical URLs (landing already sets
`https://one-more-highlight.vercel.app/`; Docusaurus emits
`https://one-more-highlight.vercel.app/docs/...` from `url` + `baseUrl`).

## Why not a docs subdomain

A second Vercel project at `docs.one-more-highlight.vercel.app` would
split canonical URLs and force the docs site to earn domain authority
from scratch. Subdirectory hosting keeps one project, one deploy, and
shared root-domain authority. Use a subdomain only if Vercel project
limits force the split.

## Out of scope

- npm publish — still the GitHub Actions Release job on `main`.
- Redirects such as `/docs/playground` → StackBlitz. Add those under
  `redirects` in `vercel.json` if needed.
- Scratch landing experiments. Only `landing/` is copied into the
  output; other folders are not deployed.
