---
sidebar_position: 2
---

# Diacritic-insensitive search

Match `"resume"` against `"résumé"` using the `sanitize` prop.

## Recipe

```tsx
import { Highlight } from 'one-more-highlight';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

<Highlight
  text="résumé and Resume and resume"
  searchWords={['resume']}
  sanitize={normalize}
  highlightClassName="hl"
/>
// Highlights all three occurrences
```

## How it works

`sanitize` is applied to both the source `text` and each string `searchWords` entry before matching. The original (unsanitized) text is still used for rendering — only the matching step uses the sanitized form.

`NFD` decomposition splits accented characters into base + combining diacritic codepoints. The `\p{Diacritic}` Unicode property class then removes all diacritics, leaving the base character. The `u` flag is required for Unicode property escapes.

## Limitations

- `sanitize` is not applied to `RegExp` entries in `searchWords` — only to strings.
- Normalization happens per-render via `useMemo`. For very long texts or frequent updates, consider memoizing the `sanitize` function reference with `useCallback`.
