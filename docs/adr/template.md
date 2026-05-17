<!--
Template for new ADRs in this repo.

To use: copy this file to `NNNN-kebab-case-title.md` (next free number, zero-padded
to 4 digits) and fill in each section. Delete any section that doesn't apply, plus
this comment block.

Bar for writing an ADR (at least two must hold):
- public API surface changes (export, prop, type)
- a reasonable contributor would propose the rejected alternative
- the reasoning won't fit in a commit message (≥ 3 trade-offs)
- the decision constrains future work

If fewer than two hold, the rationale belongs in a commit message or CLAUDE.md,
not in an ADR.
-->

# ADR-NNNN — <Decision in five-to-ten words>

- **Status:** Proposed | Accepted | Superseded by ADR-MMMM
- **Date:** YYYY-MM-DD
- **Decider:** <name>

## Context

What problem prompted this decision. What was the prior state, what changed, and
why "do nothing" stopped being acceptable. Keep this section about facts and
forces — defer the recommendation to the **Decision** section below.

## Decision

What was chosen, stated as a present-tense imperative. One paragraph, no waffling.

> Example shape:
> *Delete `src/match.ts`. Consumers write the literal field directly.*

## Why

Reasons in order of weight. This section is separate from **Decision** so a
reader can see *which forces won* without re-reading the recommendation. Three to
six numbered points is the sweet spot.

1. **Headline reason.** One sentence.
2. **Second reason.** One sentence.
3. ...

If the decision turns on a single load-bearing principle (e.g. "the deletion
test"), name and define that principle here so future readers can apply it.

## Consequences

What this enables, what it forbids, and what migration looks like. Be concrete:
- Breaking change to the public API? Note the semver impact.
- Files deleted / renamed / moved? List them.
- CLAUDE.md / README / docs site updated? Note the surfaces that had to follow.

If the change is invisible to consumers, say so explicitly — that's a useful
signal too.

## Alternatives considered

For each rejected alternative, state the alternative in one line, then why it
was rejected in a short paragraph. Skip this section only when there genuinely
weren't viable alternatives.

### <Alternative A name>

**Rejected** because: <one short paragraph>.

### <Alternative B name>

**Rejected** because: <one short paragraph>.

## Do not re-propose

<!--
Optional. Include this section only when both are true:
1. The rejected alternative is genuinely tempting — a reasonable contributor
   could propose it in good faith six months from now.
2. Re-litigating the decision is costly (e.g. it's already shipped, it constrains
   the library's public shape, or reversing it would be a breaking change).

Skip it for decisions that are obvious-in-retrospect or low-stakes-to-revisit.
-->

State *plainly* what should not be re-proposed and why. The point is to save
future-you from rerunning the same debate. One short paragraph is enough.

If a new requirement emerges that genuinely invalidates the decision, supersede
this ADR with a new one and update **Status** above — don't quietly reverse it.
