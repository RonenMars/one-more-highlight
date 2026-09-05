# ADR-0004 — Source union uses `?: undefined`, not `?: never`

- **Status:** Accepted
- **Date:** 2026-09-05
- **Decider:** Ronen Mars

## Context

`ranges` made the pipeline's input a choice of two: run the built-in matcher
over `searchWords`, or take precomputed offsets. They are mutually exclusive —
`ranges` replaces matching outright rather than adding to it — so
`HighlightSource` in `src/types.ts` is a discriminated union, and each branch
has to say something about the member it does *not* carry.

The idiomatic way to forbid a property in a union branch is `?: never`:

```ts
| { searchWords: ReadonlyArray<string | RegExp>; ranges?: never }
| { ranges: ReadonlyArray<HighlightRange>;       searchWords?: never }
```

This repo compiles with `exactOptionalPropertyTypes` (root `CLAUDE.md`, "Strict
TypeScript"), under which `?: never` means *the property may be absent, and
nothing else* — an explicit `undefined` is not "absent". Under `?: never`, both
of these are compile errors:

```tsx
<Highlight text={text} searchWords={query} ranges={undefined} />

const props = { text, searchWords: query, ranges: undefined };
<Highlight {...props} />;
```

The second is the load-bearing one. A props object assembled once and spread
into the component — the ordinary way to hand a component a computed set of
props — carries every key it was declared with, and the unused source is
`undefined` rather than absent. `?: never` rejects it for saying explicitly
what `?: undefined` lets it say.

What neither spelling accepts is a value of type
`HighlightRange[] | undefined` — "ranges if I have them, otherwise search."
That is a genuine ambiguity about which branch is in play, and the caller
resolves it by branching on whole prop objects. This ADR does not change that
case; it is only about an `undefined` the checker knows statically.

## Decision

Spell the absent member `?: undefined` in both branches of `HighlightSource`,
and spell the whole matcher-options group the same way on the `ranges` branch
(`{ [K in keyof MatcherOptions]?: undefined }`). Do not "correct" these to
`?: never`.

## Why

1. **`?: never` breaks a legitimate call pattern.** Under
   `exactOptionalPropertyTypes` it rejects `ranges={undefined}`, and with it
   any spread of a props object that carries both keys — a normal way to
   build props, and one the caller cannot fix without restructuring code
   that was never ambiguous about which source it meant.
2. **`?: undefined` narrows identically.** Both spellings make "both sources"
   and "neither source" type errors, and both let the checker pick a branch
   from the presence of `searchWords` or `ranges`. The discrimination the
   union exists for is unaffected; only the treatment of an explicit
   `undefined` differs.
3. **It costs nothing at runtime.** `useHighlight` already branches on
   `ranges ? … : …`, which treats an explicit `undefined` and an absent key
   the same way. The type now agrees with the implementation instead of being
   stricter than it.
4. **The strictness `?: never` adds is not the strictness we want.** It
   forbids passing `undefined`, not passing a *value*. Nothing is caught by
   the stricter form that the looser one lets through.

The `tests/ranges.test.tsx` type-level block pins all four cases — a source
each way, an explicit `undefined` alongside a real source, and
`@ts-expect-error` on both "both" and "neither" — so a change to `never` fails
`pnpm typecheck` rather than only failing a consumer.

## Consequences

- Invisible to consumers who pass exactly one source; the branch they use is
  the same either way.
- `MatcherOptions` on the `ranges` branch is a mapped type rather than a
  hand-listed set of `?: undefined` fields, so a new matcher option added to
  `MatcherOptions` is excluded from the `ranges` branch automatically. No
  second place to update.
- Documented for consumers in `docs/site/docs/api/types.md` under
  `HighlightSource`, so the reasoning is reachable without finding this ADR.
- Applies to the React Native union too: `src/native/types.ts` builds its
  options type from the same `HighlightSource`, so the decision holds there
  without restating it.

## Alternatives considered

### `?: never` on the absent members

**Rejected** because: under `exactOptionalPropertyTypes` it rejects
`ranges={undefined}` and `searchWords={undefined}`, and therefore any spread
of a props object that carries both keys. It buys no additional safety —
"both" and "neither" are already errors under `?: undefined`.

### Relax `exactOptionalPropertyTypes`

**Rejected** because: it would make `?: never` behave as expected, but at the
cost of weakening the whole package's type checking for one union. The strict
flags are a stated project value, and this is the only place the flag and the
idiom collide.

### Two components, or a discriminating `source` prop

`<Highlight source={{ kind: 'ranges', ranges }} />`, or a separate
`<RangeHighlight>`. **Rejected** because: an explicit discriminator is
ceremony the two required props already supply, and a second component doubles
the API surface, the docs and the snapshots for the same pipeline — the same
reasoning that rejected `<HighlightFast>` in ADR-0002.

## Do not re-propose

Do not change `?: undefined` to `?: never` in `HighlightSource`. It reads like
a tightening and looks like an obvious cleanup in review, but under this
repo's `exactOptionalPropertyTypes` setting it is a breaking change for any
consumer who passes an explicit `undefined` for the source they are not using
— and it catches nothing that `?: undefined` misses.

If TypeScript ever separates "absent" from "explicitly undefined" for `never`
in a way that keeps `ranges={undefined}` legal, supersede this ADR rather than
quietly reversing it.
