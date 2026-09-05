# Task: Smoke-test `one-more-highlight/native` in this app via a packed tarball

You are working in this Expo/React Native app:
`/Users/ronenmars/Desktop/dev/ai-tools/tb-mobile/.worktrees/integration-open-prs-20260711`

Stack (already verified — do not change): Expo ^57.0.1, React Native 0.86.0,
React 19.2.3, package manager **npm** (package-lock.json), NativeWind, expo-router
(`app/` dir, `main: expo-router/entry`).

## Goal
Install a locally-built copy of the `one-more-highlight` library (which just gained
a React Native engine) and prove `<HighlightText>` renders on a real screen. This is
a throwaway smoke test, not a permanent dependency.

## The library source
The library lives in a git worktree at:
`/Users/ronenmars/Desktop/dev/web/omh-rn-worktree` (branch `feat/react-native-support`).
It is a pnpm project. Its RN entry is the `one-more-highlight/native` subpath, which
resolves through the package `exports` map. Because this app is on RN 0.86 (new Metro,
≥0.79), the `exports` map resolves natively — no Metro config changes, no symlinks.

The package name is `one-more-highlight` (NOT `one-more-highlight-react-native`); RN
support is the `/native` subpath of that single package. Import from
`one-more-highlight/native`.

`react-native` is an OPTIONAL peer of the library, so installing the tarball will not
pull in a second copy of react/react-native — the app's own copies are used.

## Steps

### 1. Build and pack the library (in the library worktree)
```bash
cd /Users/ronenmars/Desktop/dev/web/omh-rn-worktree
pnpm build
npm pack
```
`npm pack` prints the tarball name — expect `one-more-highlight-1.2.0.tgz` in that dir.
It packs the working tree, so no commit is required. If `dist/native/index.js` does
not exist after `pnpm build`, STOP and report — the RN entry didn't build.

### 2. Install the tarball into this app
```bash
cd /Users/ronenmars/Desktop/dev/ai-tools/tb-mobile/.worktrees/integration-open-prs-20260711
npm install /Users/ronenmars/Desktop/dev/web/omh-rn-worktree/one-more-highlight-1.2.0.tgz
```
Confirm `package.json` now lists `one-more-highlight` pointing at the tarball/version,
and that `node_modules/one-more-highlight/dist/native/index.js` exists.

### 3. Add a throwaway demo screen
Create `app/omh-test.tsx` (expo-router will expose it at `/omh-test`):
```tsx
import { View } from 'react-native';
import { HighlightText } from 'one-more-highlight/native';

export default function OmhTest() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <HighlightText
        text="the quick brown fox jumps over the lazy dog"
        searchWords={['quick', 'fox', 'dog']}
        highlightStyle={{ backgroundColor: '#FFF166' }}
        states={[
          { name: 'emphasis', term: 'fox', style: { fontWeight: 'bold', color: '#b30059' } },
        ]}
        style={{ fontSize: 20, lineHeight: 30 }}
      />
    </View>
  );
}
```

### 4. Run and verify
```bash
npx expo start -c   # -c clears Metro cache; required after adding a dependency
```
Verify:
- Metro bundles with no "Unable to resolve one-more-highlight/native" error.
- No "Invalid hook call" / duplicate-React warning (would mean a second react copy —
  should NOT happen since react-native is an optional peer, but check).
- On the `/omh-test` route, "quick", "fox", and "dog" render highlighted; "fox" is
  bold + colored. Take a screenshot or describe what renders.

## Success criteria
- Tarball installs cleanly, `dist/native/index.js` present in the app's node_modules.
- App bundles and the `/omh-test` screen shows the three highlighted words with the
  per-state styling on "fox".

## Do NOT
- Do not modify `metro.config.js` — RN 0.86's Metro resolves the subpath via `exports`.
  Only if bundling fails with an unresolved-module error should you investigate, and
  then report the exact error before changing Metro config.
- Do not use `npm link` or a `file:` dependency — Metro's symlink handling makes those
  flaky. Stick to the packed tarball.
- Do not commit `app/omh-test.tsx`, the tarball, or the `package.json`/lockfile
  dependency change — this is a smoke test. Remove them (and `npm uninstall
  one-more-highlight`) when done, or leave them uncommitted for the human to inspect.

## When re-testing after a library change
Re-run `pnpm build && npm pack` in the library worktree, then
`npm install <tarball>` again in the app, then `npx expo start -c`.

## Report back
- Whether it bundled and rendered (with screenshot/description).
- Any resolution, peer-dep, or duplicate-React issues hit, verbatim.
