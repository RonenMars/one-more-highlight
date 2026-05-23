# Vercel hosting runbook — swap landing page to root, docs to sub-path

> Goal: `one-more-highlight.vercel.app/` serves the marketing landing page;
> docs move to `one-more-highlight.vercel.app/docs/` (recommended) or a
> subdomain.

## Current state (read-only — no changes yet)

Repo `vercel.json` at root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter one-more-highlight build && pnpm --filter one-more-highlight-docs build",
  "outputDirectory": "docs/site/build",
  "framework": null,
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- docs/ src/ package.json pnpm-lock.yaml pnpm-workspace.yaml tsup.config.ts tsconfig.build.json tsconfig.json vercel.json"
}
```

What it does: Builds the docs site (Docusaurus) and serves its static output
at the project's root URL. The landing page in `landing-3/` is **not**
deployed by Vercel today.

## Two hosting paths

### Option A — subdirectory (recommended, simpler, better SEO)

Single Vercel project serves both. Landing page at `/`, docs at `/docs/*`.

**One-time setup steps:**

1. **Update Docusaurus to publish under `/docs/`.**
   In `docs/site/docusaurus.config.ts`, set:
   ```ts
   const config: Config = {
     // ...
     url: 'https://one-more-highlight.vercel.app',
     baseUrl: '/docs/',
     // ...
   };
   ```
   This makes Docusaurus emit asset URLs under `/docs/` and generate
   `build/docs/index.html` instead of `build/index.html`.

2. **Update `vercel.json`** at repo root to build both surfaces and
   stitch them together:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "installCommand": "pnpm install --frozen-lockfile",
     "buildCommand": "pnpm --filter one-more-highlight build && pnpm --filter one-more-highlight-docs build && node scripts/assemble-vercel-output.mjs",
     "outputDirectory": "vercel-output",
     "framework": null
   }
   ```
   Drop the `ignoreCommand` for now (re-add later once you've verified
   builds are stable).

3. **Add an assemble script** at `scripts/assemble-vercel-output.mjs`:
   ```js
   import { cp, mkdir, rm } from 'node:fs/promises';
   import { fileURLToPath } from 'node:url';
   import { dirname, resolve } from 'node:path';

   const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
   const out = resolve(root, 'vercel-output');

   await rm(out, { recursive: true, force: true });
   await mkdir(out, { recursive: true });

   // Landing page at /
   await cp(resolve(root, 'landing-3'), out, { recursive: true });

   // Docs at /docs/
   await cp(resolve(root, 'docs/site/build'), resolve(out, 'docs'), { recursive: true });
   ```

4. **Update internal links in `landing-3/index.html`.**
   The current `https://one-more-highlight.vercel.app/docs/getting-started/intro`
   etc. still work once docs are at `/docs/`. No code change required.

5. **Update docs-site canonical URLs.** In `docs/site/docusaurus.config.ts`,
   verify `url` + `baseUrl` produce `https://one-more-highlight.vercel.app/docs/...`
   for canonical tags. Docusaurus does this automatically once the two
   fields are set.

6. **Verify locally:**
   ```sh
   pnpm install
   pnpm --filter one-more-highlight build
   pnpm --filter one-more-highlight-docs build
   node scripts/assemble-vercel-output.mjs
   npx serve vercel-output -p 4000
   open http://localhost:4000/         # landing page
   open http://localhost:4000/docs/    # docs site
   ```

7. **Push and deploy.** Vercel auto-deploys on push to main. Watch the
   build log for errors. The first deploy after the change will rebuild
   everything since `ignoreCommand` is dropped.

**Caveat:** because the landing page sits at `/`, an `index.html` exists at
the output root. Vercel will serve that as the homepage. The docs site's
own `index.html` lives at `/docs/index.html` once `baseUrl: '/docs/'` is
set. Make sure both have unique canonical URLs.

### Option B — subdomain

Two Vercel projects, two domains:
- `one-more-highlight.vercel.app` → builds `landing-3/` only
- `docs.one-more-highlight.vercel.app` → builds docs site only

**Steps:**

1. **In the Vercel dashboard,** import the same Git repo as a *second*
   project. Name it `one-more-highlight-docs`.

2. **Set project-scoped `vercel.json`** in `docs/site/vercel.json`:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
     "buildCommand": "cd ../.. && pnpm --filter one-more-highlight build && pnpm --filter one-more-highlight-docs build",
     "outputDirectory": "build",
     "framework": null
   }
   ```
   In the Vercel project settings for `one-more-highlight-docs`, set
   "Root Directory" to `docs/site`.

3. **Update the original project's `vercel.json`** at repo root to serve
   landing-3:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "buildCommand": "echo skip",
     "outputDirectory": "landing-3",
     "framework": null
   }
   ```
   (No build step — landing-3 is already a static folder.)

4. **In the Vercel dashboard,** add the custom domain
   `docs.one-more-highlight.vercel.app` to the docs project.

5. **Update Docusaurus config** to match the new URL:
   ```ts
   url: 'https://docs.one-more-highlight.vercel.app',
   baseUrl: '/',
   ```

6. **Update landing-3 links** to point at the new docs subdomain:
   - `https://one-more-highlight.vercel.app/docs/getting-started/intro`
     → `https://docs.one-more-highlight.vercel.app/getting-started/intro`
   - Same change in the footer.

7. **Update README badges and external links** to point at the new docs URL.

**Tradeoff:** subdomains don't automatically inherit root-domain authority
in Google's eyes — you'd be starting the docs site's SEO from scratch.
See `docs/design/logo-link-seo-decision.md` for the rationale behind
favoring Option A.

## Recommendation

Go with **Option A**. Single project, simpler config, root-domain authority
flows to both surfaces. Use Option B only if Vercel limits force the split
(e.g., separate build minutes/quotas).

## What this runbook does NOT do

- It does **not** delete `landing/`, `landing-2/`, `landing-3/assets/`, etc.
  Those are scratch directories and can stay in the repo (or be added to
  `.gitignore`) without affecting the deploy — the assemble script only
  copies `landing-3/`.
- It does **not** change the npm package build. The library still ships to
  npm via the existing CI pipeline.
- It does **not** set up redirects. If you want
  `/docs/playground` → StackBlitz redirect, add it to `vercel.json`
  under `"redirects": [...]`.
