/**
 * Jest config scoped to the React Native entry only. The rest of the repo
 * runs under vitest; this exists solely so `@testing-library/react-native`
 * (which assumes Jest) can exercise the `<Text>`-based renderer.
 */
module.exports = {
  preset: 'react-native',
  watchman: false,
  rootDir: '.',
  roots: ['<rootDir>/tests/native'],
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/native/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Source uses `.js` extensions on relative imports (required by the ESM build
  // + verbatimModuleSyntax). Jest resolves against on-disk `.ts`/`.tsx`, so map
  // the `.js` specifier back to the extensionless module.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // pnpm nests RN packages under node_modules/.pnpm/<name>+<name>@<ver>/... with
  // `+`-encoded scoped names, so the preset's default ignore pattern (which
  // assumes a flat node_modules and `/`-separated scopes) skips them — leaving
  // RN's Flow-typed source untransformed. Only ignore .pnpm paths whose package
  // segment is NOT one of the RN scopes; everything else transforms.
  transformIgnorePatterns: [
    'node_modules/\\.pnpm/(?!(?:@?react-native|escape-string-regexp)[+@])',
  ],
};
