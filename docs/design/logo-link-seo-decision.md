# SEO decision — what should the docs-site logo link to?

> Context: once we ship the landing page at `one-more-highlight.vercel.app/`
> and move the docs to a subdomain (e.g. `docs.one-more-highlight.vercel.app/`)
> or a sub-path (`one-more-highlight.vercel.app/docs/`), we need to decide
> where the docs-site logo's `href` should point.

## The two options

| | Option A — logo links to landing page | Option B — logo stays at docs root |
|---|---|---|
| href | `https://one-more-highlight.vercel.app/` | `/docs/getting-started/intro` |
| Reader sees on click | Marketing landing | Docs home |
| Familiar from | Stripe, Vercel, Tailwind | React.dev, MDN, Material UI |

## Recommendation: **Option B (logo stays at docs root)**

Three reasons, in order of weight.

### 1. User intent dominates SEO here.

Someone *reading* the docs who clicks the logo is almost always trying to
"get back to the table of contents," not to the marketing pitch. Sending
them to the landing page is a wrong-context bounce — they don't need to be
re-sold; they need to navigate.

Bounce rate is itself an SEO signal Google uses (indirectly, via search
engagement metrics). A docs page where most logo clicks immediately bounce
back is worse for the docs page's ranking than a logo that lands somewhere
useful.

### 2. Authority structure is fine either way — this isn't an SEO problem.

The original SEO concern behind this question would only matter if the docs
site lived on a *subdomain* (`docs.one-more-highlight.vercel.app`). Per
Google's stated policy and the consensus across the field, subdomains and
subdirectories are crawled and ranked the same way — but only when internal
linking is done thoughtfully. Subdirectories (`vercel.app/docs/…`) inherit
root-domain authority by default; subdomains have to *earn* it via inbound
links.

The logo-link choice doesn't change that math materially. What matters is:

- The docs site is **linked to** from the landing page (it is — top-nav and footer).
- The landing page is **linked to** from the docs site if Option A is chosen.

Option A would give the landing page slightly more inbound link signal from
docs pages. But the landing page is a single page; the docs are 15+ pages.
The marginal SEO value is tiny.

### 3. Picking subdirectory hosting eliminates the question almost entirely.

If we host docs under `vercel.app/docs/` (subdirectory) rather than
`docs.vercel.app/` (subdomain), the two surfaces share root-domain authority
automatically. The logo question is then purely a UX choice, and UX favors B.

## What to do instead of changing the logo link

Add explicit "Home" navigation that *does* go to the landing page:

- A "← Back to one-more-highlight.com" link in the docs top-nav (left of "Docs").
- The footer already has a link to the landing page via the GitHub repo footer.

This gives readers a clear path to the landing page without hijacking the
"return to docs home" gesture.

## When Option A would actually win

Option A makes sense in two specific cases:

1. **The landing page IS the product home.** Stripe and Vercel do this
   because their landing pages function as application-level homepages with
   live dashboards / dynamic content. For a static MIT npm library, the
   landing page is a one-time read.

2. **The docs site is a clearly sub-branded property** (e.g.
   `docs.shopify.com` vs `shopify.com`). At that point the logo "should"
   bring you back to the parent brand. For us, the docs site *is* the
   brand presence — there's no separate marketing org.

## Sources

- [Subdomain vs. Subdirectory: What They Are & How They Affect SEO — HubSpot](https://blog.hubspot.com/marketing/subdomain-vs-subdirectory)
- [Subdomain or Subdirectory: Which is Better for SEO? — DWS](https://www.digitalwebsolutions.com/blog/subdomain-vs-subdirectory-which-is-better-for-seo/)
- [Subdomain VS Subdirectory: Impact on SEO Explained — Higher Visibility](https://www.highervisibility.com/seo/learn/subdomain-vs-subdirectory/)
- [4 Factors to Consider for Subfolder and Subdomain SEO — SEO Hacker](https://seo-hacker.com/subfolder-subdomain-seo/)

---

## TL;DR

Keep the docs logo pointing to the docs root (`/docs/getting-started/intro`).
Add a separate "← Back to landing" link if you want a visible path back to
the marketing page. Pick subdirectory hosting (`/docs/`) over subdomain
(`docs.*`) to keep the SEO question moot.
