# ADR-0003 — Docs navbar title links to the docs root

- **Status:** Accepted
- **Date:** 2026-05-24
- **Decider:** Ronen Mars

## Context

PR #11 put the marketing landing page at `https://one-more-highlight.vercel.app/`
and the Docusaurus site at `https://one-more-highlight.vercel.app/docs/`.
Once those surfaces share a host, the docs navbar title (the "logo") has
to choose an `href`.

Two shapes are common:

| | Logo → landing (`/`) | Logo → docs root (`/docs/`) |
|---|---|---|
| Click lands on | Marketing page | Docs home |
| Familiar from | Stripe, Vercel, Tailwind | React.dev, MDN, Material UI |

A reasonable contributor would pick the Stripe pattern. This ADR records
why we did not.

## Decision

Keep the Docusaurus navbar title on the docs root (`baseUrl: '/docs/'`).
Expose the landing page as a separate **Home** item that sets
`href: '/'` with `autoAddBaseUrl: false`. Do not point the title/logo at
the marketing page.

`docs/site/src/pages/index.tsx` redirects `/docs/` to
`/docs/getting-started/intro`, so "docs root" and "docs intro" are the
same destination for readers.

## Why

1. **User intent.** Someone already reading the docs who clicks the
   title is trying to get back to the table of contents, not to be
   re-sold. Sending them to the landing page is a wrong-context bounce.
2. **This is not an SEO problem on a subdirectory.** Subdirectory
   hosting (`/docs/`) shares root-domain authority with the landing
   page. The logo `href` does not move that needle. A subdomain
   (`docs.*`) would have; we did not pick a subdomain (see the Vercel
   runbook).
3. **The landing page is a one-time read.** Stripe and Vercel point the
   logo at `/` because that URL is an application home. For a static MIT
   library, the brand presence *is* the docs; the landing page is a
   pitch, not a dashboard.
4. **A dedicated Home link is the right escape hatch.** Readers who do
   want the marketing page get an explicit nav item. The title stays the
   "return to docs home" gesture.

## Consequences

- Invisible to npm consumers. Docs-site navigation only.
- Implemented in #11 (`docs/site/docusaurus.config.ts` navbar +
  `docs/site/src/pages/index.tsx` redirect).
- Future navbar edits must not silently retarget the title to `/`.
- Hosting layout for the two surfaces lives in
  [`docs/design/vercel-hosting-runbook.md`](../design/vercel-hosting-runbook.md).

## Alternatives considered

### Logo links to the landing page (`/`)

**Rejected** because: it hijacks the "back to docs home" gesture for a
tiny inbound-link bonus to a single marketing URL. The docs are 15+
pages; the landing page is one. UX cost outweighs the SEO scrap.

### Docs on a `docs.*` subdomain, logo back to the parent brand

**Rejected** because: subdomains do not inherit root-domain authority
automatically. It also forces two Vercel projects and splits canonical
URLs. Subdirectory hosting made that split unnecessary, and then the
logo question collapsed to a UX choice.

## Do not re-propose

Do not point the docs navbar title or logo at
`https://one-more-highlight.vercel.app/`. If a new requirement appears
(for example the landing page becomes an authenticated product home),
supersede this ADR — don't quietly flip the `href`.
