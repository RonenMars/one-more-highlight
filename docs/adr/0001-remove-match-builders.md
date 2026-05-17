# ADR-0001 — Remove `match.one` / `match.range` / `match.many` builders

- **Status:** Accepted
- **Date:** 2026-05-16
- **Decider:** Ronen Mars

## Context

`src/match.ts` (≤ v0.5.1) shipped three builder functions intended to make the
`HighlightState` discriminated union ergonomic:

```ts
match.one(2)        // → { index: 2 }
match.range(0, 3)   // → { range: [0, 3] }
match.many([1, 4])  // → { indices: [1, 4] }
```

Callers spread the return value into a `HighlightState`:

```ts
{ name: 'active', ...match.one(2), className: 'hl-active' }
```

The intent was to "hide the discriminator" so consumers wouldn't have to learn
the union member shapes directly. CLAUDE.md captured this aspiration:

> Helper builders (`match.one/range/many`) exist to make discriminated unions
> ergonomic — when adding new selector forms, add a builder too.

## Decision

Delete `src/match.ts`. Consumers write the literal field directly:

```ts
{ name: 'active', index: 2, className: 'hl-active' }
```

The `HighlightState` discriminated union remains the canonical public type.
TypeScript still narrows on `'index' in state`, `'range' in state`, and
`'indices' in state`, so type safety is unchanged.

## Why

Applying the **deletion test**: if `match.ts` is removed, complexity does not
concentrate anywhere — it just moves one character. Each builder is a
pass-through that returns the same one-key object the caller would have typed
inline. The deletion test is the load-bearing signal that a module is not
deep: it has no leverage and no locality.

Specifically:

1. **The builder did not hide the discriminator.** Callers still spread
   `...match.one(n)` into an envelope object that needs `name`, `className`,
   and `style`. The discriminator is gone but the spread is louder than the
   field it replaces (`...match.one(2)` is wider than `index: 2`).
2. **The builder did not save tokens.** `index: 2` is shorter than
   `...match.one(2)`. The supposed ergonomic win didn't materialise.
3. **It cost a public export.** Every additional public symbol is a
   semver commitment forever. `match` was load-bearing nothing.
4. **It cost a concept.** Library users had to learn both the union shape
   *and* the builder layer. After removal, one concept ("a state is `{ name,
   …style } & one of { index, range, indices }`").
5. **It contradicted the package's stated values** — *tiny, auditable,
   discriminated unions are the canonical way*. The builder hid the canonical
   shape behind a vestigial helper.

## Consequences

- Breaking change to the public API — major version bump.
- `src/match.ts` deleted; `match` removed from `src/index.ts` exports.
- Tests, playground demos, docs site live-demos, README, ROADMAP, intro,
  quick-start, multi-state-styling, headless-hook, and render-prop pages
  rewritten to use the literal form.
- Docs API page renamed `api/match-builders` → `api/highlight-state-selectors`
  (the topic is now "selector fields on `HighlightState`," not "the `match`
  namespace").
- CLAUDE.md "Adding a new state selector form" recipe no longer instructs
  contributors to create a `match.<form>` builder. Future selector forms add a
  union member + an `applyStates` branch — nothing else.

## Alternatives considered

### Deepen the builder

Make `match.one(2, { name: 'active', className: 'hl-active' })` return a fully
formed `HighlightState`, eliminating the spread. **Rejected** because:

- The package's pitch ("tiny + auditable") favours exposing the canonical
  type, not hiding it behind a wrapper.
- It would replace one form of repetition (the spread) with another (a
  positional/keyword shuffle) and pull `HighlightStateBase` into the
  builder's signature — every base-field addition forces a builder change.
- The discriminated union already carries the ergonomic burden it was
  designed for. Adding a second front door splits the API surface without
  earning leverage.

### Keep as-is

**Rejected.** The deletion test passed cleanly: the module earns nothing.
A small library cannot afford a public export that does not earn its slot.

## Do not re-propose

Future architecture reviews should not suggest adding `match`-style builders
for `HighlightState`. The selector forms are deliberately the literal shape of
the union; that is the feature, not a wart to paper over.

If a new selector form is added (e.g. `predicate: (i: number) => boolean`),
the consumer-facing API is the new union member — no builder.
