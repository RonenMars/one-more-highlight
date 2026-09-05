# Task: Replace tb-mobile's hand-rolled highlight with `one-more-highlight/native`

You are working in the **existing git worktree**
`/Users/ronenmars/Desktop/dev/ai-tools/tb-mobile/.worktrees/anchored-search`, already
checked out on `feat/anchored-search-navigation` (this branch backs open PR #295 — the
anchored-search-navigation feature this highlight code belongs to). Confirm it's clean
before starting:

```bash
cd /Users/ronenmars/Desktop/dev/ai-tools/tb-mobile/.worktrees/anchored-search
git status --short   # expect no output
```

If it's NOT clean, STOP and report what's uncommitted before touching anything — do
not stash or discard existing work.

All paths below are relative to that worktree.

Stack (already verified — do not change): Expo ^57.0.1, React Native 0.86.0,
React 19.2.3, npm (package-lock.json), NativeWind, expo-router.

## Goal

Replace the app's current hand-rolled substring-highlight implementation with
`<HighlightText>` from `one-more-highlight/native`, keeping behavior and visuals
equivalent. This is a real migration on a real branch — not a throwaway smoke test.
Install via a packed tarball first to prove it works (see "Install" below), matching
the same verified install recipe used for the standalone smoke test at
`/Users/ronenmars/Desktop/dev/web/one-more-highlight-react-native/omh-native-smoke-test-prompt.md`
— read that file for the install mechanics (exports-map resolution, optional-peer
react-native, why not `npm link`/`file:`) if anything below is unclear.

## The library source

`/Users/ronenmars/Desktop/dev/web/omh-rn-worktree` (branch `feat/react-native-support`),
a pnpm project. Package name is `one-more-highlight` (not `-react-native`); the RN
entry is the `one-more-highlight/native` subpath via the `exports` map — resolves
natively on this app's Metro (RN 0.86, new Metro ≥0.79), no config changes needed.
`react-native` is an optional peer — installing won't duplicate react/react-native.

## What's being replaced

**`components/conversation/MessageBubble.tsx`** — the entire hand-rolled highlighter:

- `highlightSegments(text, needle, matchStyle)` (~lines 35-61): case-insensitive
  substring walk that splits `text` into plain strings interleaved with styled
  `<Text>` spans wrapping each match. Called only from `TextContent`.
- `TextContent({ text, isUser, highlight })` (~lines 63-74): calls
  `highlightSegments(text, highlight, isUser ? styles.matchOnAccent : styles.match)`
  when `highlight` is set, otherwise renders `text` plain.
- Two style objects in `makeStyles` (~lines 359-369):
  - `match`: `{ backgroundColor: \`${theme.text.accent}38\`, borderRadius: 3 }` — used
    on assistant bubbles (accent-tinted background).
  - `matchOnAccent`: `{ backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 3 }` —
    used on user bubbles, since the bubble itself is accent-colored and an
    accent-alpha highlight would be invisible there.
- `highlight?: string` prop threading: `MessageBubble` Props (~line 18) →
  `ContentBlock` (~line 282, text branch only — never passed to `tool_use` rendering)
  → `TextBlockBody` (~line 254) → `TextContent`. Do not change this prop-threading
  chain; only swap what happens *inside* `TextContent`.

**Do NOT touch** `CodeBlock` / `HighlightedCode` / Prism syntax highlighting in this
same file — unrelated "highlight" (code syntax coloring), same word, different
feature. Only the search-keyword highlighter changes.

**Sibling copy — same pattern, separate file, migrate too for consistency:**
`components/sessions/shared/ConversationListItem.tsx` has its own
`highlightSegments` function (~line 281, per the comment in MessageBubble.tsx) used
for the row-preview snippet in search results / conversation list. Same
case-insensitive-substring logic, single style (no user/assistant split since list
rows never render on an accent background). Migrate this one too — check its exact
current shape before editing, it wasn't parameterized the same way as MessageBubble's.

**How `highlight` gets set today** (context only, do not change): in
`app/conversation/[id].tsx`, `renderItem` passes `highlight={isAnchored && searchQuery
&& item.messageIndex === anchorIndex ? searchQuery : undefined}` — only the single
active search-match row ever receives a non-undefined `highlight`. The value is
always the raw search query string, never an array — `one-more-highlight`'s
`searchWords` prop takes an array, so wrap it: `searchWords={highlight ? [highlight] :
[]}` (or skip rendering `<HighlightText>` entirely and fall back to plain `<Text>`
when `highlight` is undefined/empty, matching today's behavior exactly).

## Install (packed tarball — proven working, see full smoke-test doc for why)

```bash
cd /Users/ronenmars/Desktop/dev/web/omh-rn-worktree
pnpm build
npm pack   # produces one-more-highlight-1.2.0.tgz in this dir; no commit needed
```

If `dist/native/index.js` doesn't exist after `pnpm build`, STOP and report — the RN
entry didn't build.

```bash
cd /Users/ronenmars/Desktop/dev/ai-tools/tb-mobile/.worktrees/anchored-search
npm install /Users/ronenmars/Desktop/dev/web/omh-rn-worktree/one-more-highlight-1.2.0.tgz
```

Confirm `package.json` lists `one-more-highlight` pointing at the tarball/version, and
`node_modules/one-more-highlight/dist/native/index.js` exists. This tarball install is
temporary scaffolding for local iteration — once the migration is confirmed working,
flag to the human that `package.json`/lockfile need the real npm-published version
substituted in before merge (not part of this task; just note it).

## Implementation

1. In `MessageBubble.tsx`, import `HighlightText` from `one-more-highlight/native`.
2. Replace `TextContent`'s highlight branch: instead of calling
   `highlightSegments(...)`, render `<HighlightText text={text} searchWords={highlight
   ? [highlight.trim()] : []} highlightStyle={isUser ? styles.matchOnAccent :
   styles.match} style={[styles.messageText, isUser && { color:
   theme.text.onAccent }]} selectable />` when a highlight is active; keep the
   existing plain `<Text>` path for the no-highlight case (avoid paying
   `HighlightText`'s overhead on every unhighlighted row — memo-cheapness matters here
   since this renders per-message-block).
3. Delete the now-unused `highlightSegments` function from `MessageBubble.tsx`.
4. Confirm `highlightStyle` accepts the same style object shape (`backgroundColor` +
   `borderRadius`) `match`/`matchOnAccent` already use — check the library's
   `HighlightText` prop types (`dist/native/index.d.ts` or the source in
   `omh-rn-worktree`) if unsure whether it wants a `TextStyle` or something else.
5. Repeat steps 2-4's pattern (adapted) in `ConversationListItem.tsx` for its
   highlight usage — first read its current implementation, it may not be identical
   in shape.
6. Case-insensitivity: confirm `one-more-highlight` matches case-insensitively by
   default (the current code lowercases both sides before comparing). If it doesn't,
   check for a case-insensitive option/prop before writing a workaround.

## Verify

- `npx tsc --noEmit` — clean.
- `npx eslint components/conversation/MessageBubble.tsx components/sessions/shared/ConversationListItem.tsx` — clean (warnings OK per repo convention, no errors).
- Run the existing test suites that already cover this behavior — do not write new
  ones unless a test genuinely can't be adapted:
  - `npx jest __tests__/integration/components/MessageBubble.test.tsx` — has a whole
    "search highlight" describe block (wraps needle, case-insensitive, multiple
    occurrences, no-highlight-prop plain render, code-fence exclusion, user-role
    on-accent style). Adapt assertions to `HighlightText`'s actual rendered output
    shape if they don't pass unmodified (e.g. it may render differently structured
    nested `<Text>` nodes than the hand-rolled version — check what
    `getByText`/`queryAllByText` actually find and adjust assertions, not the
    intent of each test).
  - Any equivalent tests for `ConversationListItem.tsx` — search `__tests__/` for
    references to its highlight behavior.
- `npx expo start -c` and manually verify a search-anchored conversation still shows
  the keyword highlighted correctly (both an assistant-bubble example and a
  user-bubble example, to confirm both `match`/`matchOnAccent`-equivalent styles
  still render distinctly).

## Do NOT

- Do not modify `metro.config.js` — the exports-map subpath resolves without config
  changes on this app's Metro version. If bundling fails with an unresolved-module
  error, investigate and report the exact error before changing Metro config.
- Do not use `npm link` or a `file:` dependency — stick to the packed tarball.
- Do not touch the Prism/`CodeBlock` syntax-highlighting code in `MessageBubble.tsx`.
- Do not change the `highlight` prop-threading chain (`MessageBubble` → `ContentBlock`
  → `TextBlockBody` → `TextContent`) or how `app/conversation/[id].tsx` decides which
  row gets `highlight` set — only what happens inside the leaf render.
- Do not commit anything yet — leave the branch's changes uncommitted for the human to
  review, including the tarball-based `package.json`/lockfile change (flag it in your
  report; don't silently leave a tarball dependency and call it done). This branch
  backs an **open PR (#295)** — an uncommitted local change is safe to leave as-is,
  but do not push, and do not run anything that could rewrite history on this branch
  (no rebase, no amend, no force-push).

## Report back

- Whether both files were migrated, and whether tests needed assertion changes (list
  which ones and why).
- Whether `HighlightText`'s output structure differs meaningfully from the old
  `highlightSegments` output (e.g. different nested-Text shape) — this matters for
  anyone auditing the diff.
- The `package.json`/lockfile tarball-dependency situation, explicitly, so it's not
  missed before merge.
- Screenshot or description of the manual verification (assistant + user bubble
  highlight, list-row highlight).
